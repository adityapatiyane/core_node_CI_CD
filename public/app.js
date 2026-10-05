const API_URL = '/api/users';

const form = document.getElementById('user-form');
const formTitle = document.getElementById('form-title');
const userIdInput = document.getElementById('user-id');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const refreshBtn = document.getElementById('refresh-btn');
const usersBody = document.getElementById('users-body');
const messageEl = document.getElementById('message');

function showMessage(text, type = 'success') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  if (text) {
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 3500);
  }
}

function resetForm() {
  form.reset();
  userIdInput.value = '';
  formTitle.textContent = 'Add User';
  submitBtn.textContent = 'Add User';
  cancelBtn.classList.add('hidden');
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

async function fetchUsers() {
  usersBody.innerHTML =
    '<tr><td colspan="6" class="empty">Loading users...</td></tr>';

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to load users');

    const users = await res.json();

    if (!users.length) {
      usersBody.innerHTML =
        '<tr><td colspan="6" class="empty">No users yet. Add your first user above.</td></tr>';
      return;
    }

    usersBody.innerHTML = users
      .map(
        (user) => `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.phone)}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <div class="row-actions">
            <button class="btn edit" data-edit='${JSON.stringify(user)}'>Edit</button>
            <button class="btn delete" data-delete="${user.id}">Delete</button>
          </div>
        </td>
      </tr>`
      )
      .join('');
  } catch (err) {
    usersBody.innerHTML =
      '<tr><td colspan="6" class="empty">Could not load users. Is the server running?</td></tr>';
    showMessage(err.message, 'error');
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function startEdit(user) {
  userIdInput.value = user.id;
  nameInput.value = user.name;
  emailInput.value = user.email;
  phoneInput.value = user.phone;
  formTitle.textContent = `Edit User #${user.id}`;
  submitBtn.textContent = 'Update User';
  cancelBtn.classList.remove('hidden');
  nameInput.focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
  };

  if (payload.name.length < 2) {
    showMessage('Name must be at least 2 characters.', 'error');
    return;
  }

  const id = userIdInput.value;
  const isEdit = Boolean(id);
  const url = isEdit ? `${API_URL}/${id}` : API_URL;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');

    showMessage(isEdit ? 'User updated successfully.' : 'User added successfully.');
    resetForm();
    fetchUsers();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

usersBody.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const deleteBtn = e.target.closest('[data-delete]');

  if (editBtn) {
    startEdit(JSON.parse(editBtn.dataset.edit));
    return;
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.delete;
    if (!confirm(`Delete user #${id}?`)) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      showMessage(data.message || 'User deleted.');
      if (userIdInput.value === id) resetForm();
      fetchUsers();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }
});

cancelBtn.addEventListener('click', resetForm);
refreshBtn.addEventListener('click', fetchUsers);

fetchUsers();

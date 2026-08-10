const authMessage = document.getElementById('authMessage');
const signInLink = document.getElementById('signInLink');
const signUpLink = document.getElementById('signUpLink');
const profileLink = document.getElementById('profileLink');
const logoutButton = document.getElementById('logoutButton');
const profilePageForm = document.getElementById('profilePageForm');
const profileDisplayName = document.getElementById('profileDisplayName');
const profileDisplayUsername = document.getElementById('profileDisplayUsername');
const profileDisplayEmail = document.getElementById('profileDisplayEmail');
const profileDisplayCreatedAt = document.getElementById('profileDisplayCreatedAt');
const signupPageForm = document.getElementById('signupPageForm');
const signinPageForm = document.getElementById('signinPageForm');
const adminUserForm = document.getElementById('adminUserForm');
const adminMessage = document.getElementById('adminMessage');
const adminUserCardList = document.getElementById('adminUserCardList');
const adminSearchInput = document.getElementById('adminSearchInput');
const exportSelectedBtn = document.getElementById('exportSelectedBtn');
const exportAllBtn = document.getElementById('exportAllBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const adminPaginationInfo = document.getElementById('adminPaginationInfo');
const selectAllUsers = document.getElementById('selectAllUsers');
const showCreateUserFormButton = document.getElementById('showCreateUserForm');
const cancelAdminEditButton = document.getElementById('cancelAdminEdit');
const adminProfileView = document.getElementById('adminProfileView');
const adminLoginForm = document.getElementById('adminLoginForm');
let currentUser = null;
let adminAuthToken = localStorage.getItem('purematchAdminToken');
let authToken = localStorage.getItem('purematchToken');
let adminUsers = [];
let filteredAdminUsers = [];
let currentAdminPage = 1;
const adminUsersPerPage = 10;
const selectedAdminIds = new Set();
const isDedicatedAuthPage = ['/signin', '/signup'].includes(window.location.pathname);
const isProfilePage = window.location.pathname === '/profile';

function showMessage(message, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.style.display = 'block';
    authMessage.style.background = isError ? '#fdecea' : '#fdf3f5';
    authMessage.style.color = isError ? '#b42318' : '#7a3442';
}

function showAdminMessage(message, isError = false) {
    if (!adminMessage) return;
    adminMessage.textContent = message;
    adminMessage.style.display = 'block';
    adminMessage.style.background = isError ? '#fdecea' : '#fdf3f5';
    adminMessage.style.color = isError ? '#b42318' : '#7a3442';
}

function clearMessage() {
    if (authMessage) {
        authMessage.style.display = 'none';
        authMessage.textContent = '';
    }
}

function showSignupSuccessMessage() {
    if (!authMessage) return;

    authMessage.innerHTML = 'Assalamu Alaikum! Your account has been created successfully. Please <a href="/signin" class="auth-page-link">sign in</a> and complete your profile.';
    authMessage.style.display = 'block';
    authMessage.style.background = '#fdf3f5';
    authMessage.style.color = '#7a3442';
}

function updateAuthNavState() {
    const loggedIn = !!authToken || !!adminAuthToken;

    if (signInLink) {
        signInLink.style.display = loggedIn ? 'none' : 'inline-flex';
    }

    if (signUpLink) {
        signUpLink.style.display = loggedIn ? 'none' : 'inline-flex';
    }

    if (profileLink) {
        profileLink.style.display = loggedIn && !!authToken ? 'inline-flex' : 'none';
    }

    if (logoutButton) {
        logoutButton.style.display = loggedIn ? 'inline-flex' : 'none';
    }
}

function handleLogout() {
    localStorage.removeItem('purematchToken');
    localStorage.removeItem('purematchAdminToken');
    authToken = null;
    adminAuthToken = null;
    currentUser = null;
    updateAuthNavState();
    if (window.location.pathname === '/profile' || window.location.pathname === '/admin') {
        window.location.href = '/signin';
    } else {
        window.location.href = '/';
    }
}

async function restoreSession() {
    if (!authToken) return;

    if (isDedicatedAuthPage && !isProfilePage) {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const data = await response.json();

            if (data.success) {
                currentUser = data.user;
                updateAuthNavState();
                window.location.href = '/profile';
                return;
            }
        } catch (error) {
            console.error(error);
        }
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            updateAuthNavState();
            if (isProfilePage) {
                populateProfileForm(data.user);
            }
            clearMessage();
        } else {
            localStorage.removeItem('purematchToken');
            authToken = null;
            updateAuthNavState();
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleAuthSubmit(form, endpoint) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            if (endpoint === '/api/auth/signup') {
                localStorage.removeItem('purematchToken');
                localStorage.removeItem('purematchAdminToken');
                authToken = null;
                adminAuthToken = null;
                currentUser = null;
                updateAuthNavState();
                form.reset();
                showSignupSuccessMessage();
                return;
            }

            if (data.user?.admin) {
                localStorage.removeItem('purematchToken');
                localStorage.setItem('purematchAdminToken', data.token);
                authToken = null;
                adminAuthToken = data.token;
                currentUser = data.user;
                updateAuthNavState();
                window.location.href = '/admin';
                return;
            }

            localStorage.removeItem('purematchAdminToken');
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('purematchToken', authToken);
            updateAuthNavState();
            if (isDedicatedAuthPage || isProfilePage) {
                window.location.href = '/profile';
                return;
            }
            showMessage(data.message);
            form.reset();
        } else {
            showMessage(data.message, true);
        }
    } catch (error) {
        showMessage('Unable to complete request right now.', true);
    }
}

function renderProfileSummary(user) {
    if (!user) return;

    if (profileDisplayName) {
        profileDisplayName.textContent = user.name || 'Your Profile';
    }

    if (profileDisplayUsername) {
        profileDisplayUsername.textContent = user.username || '—';
    }

    if (profileDisplayEmail) {
        profileDisplayEmail.textContent = user.email || '—';
    }

    if (profileDisplayCreatedAt) {
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
        profileDisplayCreatedAt.textContent = createdAt;
    }
}

function populateProfileForm(user) {
    if (!profilePageForm) return;
    renderProfileSummary(user);

    const profileData = user?.profile || {};
    Array.from(profilePageForm.elements).forEach((element) => {
        if (element.name && profileData[element.name] !== undefined) {
            element.value = profileData[element.name];
        }
    });
}

async function saveProfile(e) {
    e.preventDefault();
    if (!authToken) return;

    const payload = Object.fromEntries(new FormData(e.target).entries());

    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            showMessage('Profile saved successfully.');
        } else {
            showMessage(data.message, true);
        }
    } catch (error) {
        showMessage('Unable to save profile right now.', true);
    }
}

if (signupPageForm) {
    signupPageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAuthSubmit(signupPageForm, '/api/auth/signup');
    });
}

if (signinPageForm) {
    signinPageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAuthSubmit(signinPageForm, '/api/auth/signin');
    });
}

if (profilePageForm) {
    profilePageForm.addEventListener('submit', saveProfile);
}

if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}

async function fetchUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        });
        const data = await response.json();
        if (!data.success) {
            showAdminMessage(data.message, true);
            if (response.status === 401) {
                window.location.href = '/admin/login';
            }
            return;
        }

        adminUsers = data.users;
        filteredAdminUsers = [...adminUsers];
        currentAdminPage = 1;
        selectedAdminIds.clear();
        if (selectAllUsers) selectAllUsers.checked = false;
        renderAdminUsers();
    } catch (error) {
        showAdminMessage('Unable to load users right now.', true);
    }
}

function getCurrentAdminPageUsers() {
    const start = (currentAdminPage - 1) * adminUsersPerPage;
    return filteredAdminUsers.slice(start, start + adminUsersPerPage);
}

function updateAdminPagination() {
    if (!adminPaginationInfo || !prevPageBtn || !nextPageBtn) return;
    const total = filteredAdminUsers.length;
    const start = total === 0 ? 0 : (currentAdminPage - 1) * adminUsersPerPage + 1;
    const end = Math.min(currentAdminPage * adminUsersPerPage, total);
    adminPaginationInfo.textContent = `Showing ${start}-${end} of ${total}`;
    prevPageBtn.disabled = currentAdminPage <= 1;
    nextPageBtn.disabled = currentAdminPage * adminUsersPerPage >= total;
}

function applyAdminSearch() {
    const query = adminSearchInput?.value.trim().toLowerCase() || '';
    filteredAdminUsers = adminUsers.filter((user) => {
        if (!query) return true;
        const profile = user.profile || {};
        return [
            user.name,
            user.email,
            user.username,
            String(user.id),
            profile.contactNumber,
            profile.religion,
            profile.sect,
            profile.maritalStatus,
            profile.gender,
            profile.caste,
            profile.language,
            profile.city
        ].some((value) => value && value.toString().toLowerCase().includes(query));
    });
    currentAdminPage = 1;
    if (selectAllUsers) selectAllUsers.checked = false;
    renderAdminUsers();
}

function toggleSelectAllVisibleRows(checked) {
    getCurrentAdminPageUsers().forEach((user) => {
        if (checked) {
            selectedAdminIds.add(user.id);
        } else {
            selectedAdminIds.delete(user.id);
        }
    });
    renderAdminUsers();
}

function renderAdminUsers() {
    if (!adminUserCardList) return;

    adminUserCardList.innerHTML = '';
    const pageUsers = getCurrentAdminPageUsers();

    pageUsers.forEach((user) => {
        const selected = selectedAdminIds.has(user.id);
        const card = document.createElement('article');
        card.className = 'admin-user-card';
        card.innerHTML = `
            <div class="admin-user-card-header">
                <label class="admin-user-card-checkbox">
                    <input type="checkbox" class="select-user-checkbox" data-select-user="${user.id}" ${selected ? 'checked' : ''}>
                </label>
                <div class="admin-user-card-title">
                    <div class="admin-user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="admin-user-name">${user.name || '—'}</div>
                        <div class="admin-user-sub">ID #${user.id}</div>
                    </div>
                </div>
                <div class="admin-user-badge-row">
                    <span class="admin-badge ${user.verified ? 'verified' : ''}">${user.verified ? 'Verified' : 'Pending'}</span>
                </div>
            </div>
            <div class="admin-user-card-body">
                <div><strong>Email:</strong> ${user.email ? `<a href="mailto:${user.email}">${user.email}</a>` : '—'}</div>
                <div><strong>Contact:</strong> ${user.profile?.contactNumber || '—'}</div>
                <div><strong>Username:</strong> ${user.username || '—'}</div>
                <div><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="admin-user-card-actions">
                <a href="/admin/profile?id=${user.id}" class="admin-link-btn">View Profile</a>
                <button type="button" class="admin-link-btn" data-export-user="${user.id}">Export PDF</button>
                <button type="button" class="admin-action-btn" data-edit-user="${user.id}">Edit</button>
                <button type="button" class="admin-action-btn danger" data-delete-user="${user.id}">Delete</button>
            </div>
        `;
        adminUserCardList.appendChild(card);
    });

    adminUserCardList.querySelectorAll('.select-user-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            const id = Number(checkbox.dataset.selectUser);
            if (checkbox.checked) {
                selectedAdminIds.add(id);
            } else {
                selectedAdminIds.delete(id);
            }
            if (selectAllUsers) {
                const allVisibleSelected = getCurrentAdminPageUsers().every((user) => selectedAdminIds.has(user.id));
                selectAllUsers.checked = allVisibleSelected;
            }
        });
    });

    adminUserCardList.querySelectorAll('[data-edit-user]').forEach((button) => {
        button.addEventListener('click', async () => {
            const id = Number(button.dataset.editUser);
            await loadUserForEdit(id);
        });
    });

    adminUserCardList.querySelectorAll('[data-delete-user]').forEach((button) => {
        button.addEventListener('click', async () => {
            const id = Number(button.dataset.deleteUser);
            if (confirm('Delete this user?')) {
                await deleteUser(id);
            }
        });
    });

    adminUserCardList.querySelectorAll('[data-export-user]').forEach((button) => {
        button.addEventListener('click', async () => {
            const id = Number(button.dataset.exportUser);
            await exportUserPdf(id);
        });
    });

    updateAdminPagination();
}

function exportUsersPdfForIds(ids) {
    const records = adminUsers.filter((user) => ids.includes(user.id));
    if (records.length === 0) {
        showAdminMessage('No users selected for export.', true);
        return;
    }

    const content = `
        <html>
            <body style="font-family: Arial; padding: 24px;">
                <h1>PureMatch User Profiles</h1>
                ${records.map((user) => `
                    <section style="margin-bottom: 24px; page-break-after: always;">
                        <h2>${user.name || 'Unknown User'}</h2>
                        <p><strong>Email:</strong> ${user.email || ''}</p>
                        <p><strong>Contact:</strong> ${user.profile?.contactNumber || ''}</p>
                        <p><strong>Username:</strong> ${user.username || ''}</p>
                        <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                        <h3>Profile Details</h3>
                        <p><strong>Qualification:</strong> ${user.profile?.qualification || ''}</p>
                        <p><strong>Occupation:</strong> ${user.profile?.occupation || ''}</p>
                        <p><strong>Age:</strong> ${user.profile?.age || ''}</p>
                        <p><strong>Height:</strong> ${user.profile?.height || ''}</p>
                        <p><strong>Religion:</strong> ${user.profile?.religion || ''}</p>
                        <p><strong>Sect:</strong> ${user.profile?.sect || ''}</p>
                        <p><strong>Marital Status:</strong> ${user.profile?.maritalStatus || ''}</p>
                        <p><strong>Gender:</strong> ${user.profile?.gender || ''}</p>
                        <p><strong>Caste:</strong> ${user.profile?.caste || ''}</p>
                        <p><strong>Language:</strong> ${user.profile?.language || ''}</p>
                        <p><strong>City:</strong> ${user.profile?.city || ''}</p>
                        <p><strong>Family Members:</strong> ${user.profile?.familyMembers || ''}</p>
                        <p><strong>Family Type:</strong> ${user.profile?.familyType || ''}</p>
                        <p><strong>Skin Color:</strong> ${user.profile?.skinColor || ''}</p>
                        <p><strong>Reason:</strong> ${user.profile?.reason || ''}</p>
                    </section>
                `).join('')}
            </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function exportAllAdminUsers() {
    exportUsersPdfForIds(filteredAdminUsers.map((user) => user.id));
}

function exportSelectedAdminUsers() {
    if (selectedAdminIds.size === 0) {
        showAdminMessage('Please select at least one user to export.', true);
        return;
    }
    exportUsersPdfForIds(Array.from(selectedAdminIds));
}

async function loadUserForEdit(id) {
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        });
        const data = await response.json();

        if (!data.success) {
            showAdminMessage(data.message, true);
            if (response.status === 401) {
                window.location.href = '/admin/login';
            }
            return;
        }

        const user = data.user;
        const form = adminUserForm;
        if (!form) return;

        const setFieldValue = (name, value = '') => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value;
            }
        };

        form.style.display = 'block';
        setFieldValue('id', user.id || '');
        setFieldValue('name', user.name || '');
        setFieldValue('email', user.email || '');
        setFieldValue('username', user.username || '');
        setFieldValue('password', '');
        setFieldValue('qualification', user.profile?.qualification || '');
        setFieldValue('occupation', user.profile?.occupation || '');
        setFieldValue('age', user.profile?.age || '');
        setFieldValue('height', user.profile?.height || '');
        setFieldValue('religion', user.profile?.religion || '');
        setFieldValue('sect', user.profile?.sect || '');
        setFieldValue('maritalStatus', user.profile?.maritalStatus || '');
        setFieldValue('gender', user.profile?.gender || '');
        setFieldValue('caste', user.profile?.caste || '');
        setFieldValue('language', user.profile?.language || '');
        setFieldValue('city', user.profile?.city || '');
        setFieldValue('contactNumber', user.profile?.contactNumber || '');
        setFieldValue('familyMembers', user.profile?.familyMembers || '');
        setFieldValue('familyType', user.profile?.familyType || '');
        setFieldValue('skinColor', user.profile?.skinColor || '');
        setFieldValue('reason', user.profile?.reason || '');
        showAdminMessage('Editing selected user.');
    } catch (error) {
        showAdminMessage('Unable to load selected user.', true);
    }
}

async function deleteUser(id) {
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        });
        const data = await response.json();
        showAdminMessage(data.message, !data.success);
        if (response.status === 401) {
            window.location.href = '/admin/login';
        }
        if (data.success) {
            fetchUsers();
        }
    } catch (error) {
        showAdminMessage('Unable to delete user right now.', true);
    }
}

async function exportUserPdf(id) {
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        });
        const data = await response.json();

        if (!data.success) {
            showAdminMessage(data.message, true);
            if (response.status === 401) {
                window.location.href = '/admin/login';
            }
            return;
        }

        const user = data.user;
        const content = `
            <html>
                <body style="font-family: Arial; padding: 24px;">
                    <h1>PureMatch User Profile</h1>
                    <p><strong>Name:</strong> ${user.name || ''}</p>
                    <p><strong>Email:</strong> ${user.email || ''}</p>
                    <p><strong>Username:</strong> ${user.username || ''}</p>
                    <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                    <h3>Profile Details</h3>
                    <p><strong>Qualification:</strong> ${user.profile?.qualification || ''}</p>
                    <p><strong>Occupation:</strong> ${user.profile?.occupation || ''}</p>
                    <p><strong>Age:</strong> ${user.profile?.age || ''}</p>
                    <p><strong>Height:</strong> ${user.profile?.height || ''}</p>
                    <p><strong>Contact Number:</strong> ${user.profile?.contactNumber || ''}</p>
                    <p><strong>Religion:</strong> ${user.profile?.religion || ''}</p>
                    <p><strong>Sect:</strong> ${user.profile?.sect || ''}</p>
                    <p><strong>Marital Status:</strong> ${user.profile?.maritalStatus || ''}</p>
                    <p><strong>Gender:</strong> ${user.profile?.gender || ''}</p>
                    <p><strong>Caste:</strong> ${user.profile?.caste || ''}</p>
                    <p><strong>Language:</strong> ${user.profile?.language || ''}</p>
                    <p><strong>City:</strong> ${user.profile?.city || ''}</p>
                    <p><strong>Family Members:</strong> ${user.profile?.familyMembers || ''}</p>
                    <p><strong>Family Type:</strong> ${user.profile?.familyType || ''}</p>
                    <p><strong>Skin Color:</strong> ${user.profile?.skinColor || ''}</p>
                    <p><strong>Reason:</strong> ${user.profile?.reason || ''}</p>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    } catch (error) {
        showAdminMessage('Unable to export profile PDF right now.', true);
    }
}

if (adminUserForm) {
    adminUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(adminUserForm);
        const payload = Object.fromEntries(formData.entries());
        const id = Number(payload.id);
        const profilePayload = {
            qualification: payload.qualification,
            occupation: payload.occupation,
            age: payload.age,
            height: payload.height,
            contactNumber: payload.contactNumber,
            religion: payload.religion,
            sect: payload.sect,
            maritalStatus: payload.maritalStatus,
            gender: payload.gender,
            caste: payload.caste,
            language: payload.language,
            city: payload.city,
            familyMembers: payload.familyMembers,
            familyType: payload.familyType,
            skinColor: payload.skinColor,
            reason: payload.reason
        };

        const requestOptions = {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminAuthToken}`
            },
            body: JSON.stringify({ ...payload, profile: profilePayload })
        };

        const endpoint = id ? `/api/admin/users/${id}` : '/api/admin/users';
        try {
            const response = await fetch(endpoint, requestOptions);
            const data = await response.json();
            showAdminMessage(data.message, !data.success);
            if (response.status === 401) {
                window.location.href = '/admin/login';
            }
            if (data.success) {
                adminUserForm.reset();
                adminUserForm.style.display = 'none';
                fetchUsers();
            }
        } catch (error) {
            showAdminMessage('Unable to save user right now.', true);
        }
    });
}

if (showCreateUserFormButton) {
    showCreateUserFormButton.addEventListener('click', () => {
        if (adminUserForm) {
            adminUserForm.reset();
            adminUserForm.querySelector('[name="id"]').value = '';
            adminUserForm.style.display = 'block';
        }
    });
}

if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => {
        applyAdminSearch();
    });
}

if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentAdminPage > 1) {
            currentAdminPage -= 1;
            renderAdminUsers();
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredAdminUsers.length / adminUsersPerPage);
        if (currentAdminPage < maxPage) {
            currentAdminPage += 1;
            renderAdminUsers();
        }
    });
}

if (selectAllUsers) {
    selectAllUsers.addEventListener('change', () => {
        toggleSelectAllVisibleRows(selectAllUsers.checked);
    });
}

if (exportAllBtn) {
    exportAllBtn.addEventListener('click', exportAllAdminUsers);
}

if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', exportSelectedAdminUsers);
}

if (cancelAdminEditButton && adminUserForm) {
    cancelAdminEditButton.addEventListener('click', () => {
        adminUserForm.reset();
        adminUserForm.style.display = 'none';
    });
}

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(adminLoginForm);
        const payload = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                adminAuthToken = data.token;
                localStorage.setItem('purematchAdminToken', adminAuthToken);
                window.location.href = '/admin';
            } else {
                showMessage(data.message, true);
            }
        } catch (error) {
            showMessage('Unable to sign in as admin right now.', true);
        }
    });
}

if (adminProfileView) {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    if (userId) {
        fetch(`/api/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    adminProfileView.innerHTML = `<p>${data.message}</p>`;
                    return;
                }

                const user = data.user;
                const profile = user.profile || {};
                adminProfileView.innerHTML = `
                    <div class="profile-summary-card">
                        <p class="profile-summary-label">Complete User Profile</p>
                        <h2>${user.name || 'Unknown User'}</h2>
                        <div class="profile-summary-meta">
                            <div><span class="meta-label">Username</span><strong>${user.username || '—'}</strong></div>
                            <div><span class="meta-label">Email</span><strong>${user.email || '—'}</strong></div>
                            <div><span class="meta-label">Created</span><strong>${new Date(user.createdAt).toLocaleDateString()}</strong></div>
                        </div>
                    </div>
                    <div class="profile-grid">
                        <div><strong>Qualification:</strong> ${profile.qualification || '—'}</div>
                        <div><strong>Occupation:</strong> ${profile.occupation || '—'}</div>
                        <div><strong>Age:</strong> ${profile.age || '—'}</div>
                        <div><strong>Height:</strong> ${profile.height || '—'}</div>
                        <div><strong>Contact Number:</strong> ${profile.contactNumber || '—'}</div>
                        <div><strong>Religion:</strong> ${profile.religion || '—'}</div>
                        <div><strong>Sect:</strong> ${profile.sect || '—'}</div>
                        <div><strong>Marital Status:</strong> ${profile.maritalStatus || '—'}</div>
                        <div><strong>Gender:</strong> ${profile.gender || '—'}</div>
                        <div><strong>Caste:</strong> ${profile.caste || '—'}</div>
                        <div><strong>Language:</strong> ${profile.language || '—'}</div>
                        <div><strong>City:</strong> ${profile.city || '—'}</div>
                        <div><strong>Family Members:</strong> ${profile.familyMembers || '—'}</div>
                        <div><strong>Family Type:</strong> ${profile.familyType || '—'}</div>
                        <div><strong>Skin Color:</strong> ${profile.skinColor || '—'}</div>
                        <div><strong>Reason:</strong> ${profile.reason || '—'}</div>
                    </div>
                `;
            })
            .catch(() => {
                adminProfileView.innerHTML = '<p>Unable to load profile details.</p>';
            });
    }
}

restoreSession();
updateAuthNavState();

if (adminAuthToken && window.location.pathname === '/admin') {
    updateAuthNavState();
}

if (window.location.pathname === '/admin') {
    if (!adminAuthToken) {
        window.location.href = '/admin/login';
    } else {
        fetch('/api/admin/me', {
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        }).then((response) => {
            if (!response.ok) {
                localStorage.removeItem('purematchAdminToken');
                window.location.href = '/admin/login';
                return;
            }

            if (adminUserCardList) {
                fetchUsers();
            }
        }).catch(() => {
            localStorage.removeItem('purematchAdminToken');
            window.location.href = '/admin/login';
        });
    }
} else if (window.location.pathname === '/admin/profile') {
    if (!adminAuthToken) {
        window.location.href = '/admin/login';
    } else {
        fetch('/api/admin/me', {
            headers: { Authorization: `Bearer ${adminAuthToken}` }
        }).then((response) => {
            if (!response.ok) {
                localStorage.removeItem('purematchAdminToken');
                window.location.href = '/admin/login';
                return;
            }

            if (adminProfileView) {
                const params = new URLSearchParams(window.location.search);
                const userId = params.get('id');
                if (userId) {
                    fetch(`/api/admin/users/${userId}`, {
                        headers: { Authorization: `Bearer ${adminAuthToken}` }
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (!data.success) {
                                adminProfileView.innerHTML = `<p>${data.message}</p>`;
                                return;
                            }

                            const user = data.user;
                            const profile = user.profile || {};
                            adminProfileView.innerHTML = `
                                <div class="profile-summary-card">
                                    <p class="profile-summary-label">Complete User Profile</p>
                                    <h2>${user.name || 'Unknown User'}</h2>
                                    <div class="profile-summary-meta">
                                        <div><span class="meta-label">Username</span><strong>${user.username || '—'}</strong></div>
                                        <div><span class="meta-label">Email</span><strong>${user.email || '—'}</strong></div>
                                        <div><span class="meta-label">Created</span><strong>${new Date(user.createdAt).toLocaleDateString()}</strong></div>
                                    </div>
                                </div>
                                <div class="profile-grid">
                                    <div><strong>Qualification:</strong> ${profile.qualification || '—'}</div>
                                    <div><strong>Occupation:</strong> ${profile.occupation || '—'}</div>
                                    <div><strong>Age:</strong> ${profile.age || '—'}</div>
                                    <div><strong>Height:</strong> ${profile.height || '—'}</div>
                                    <div><strong>Religion:</strong> ${profile.religion || '—'}</div>
                                    <div><strong>Sect:</strong> ${profile.sect || '—'}</div>
                                    <div><strong>Marital Status:</strong> ${profile.maritalStatus || '—'}</div>
                                    <div><strong>Gender:</strong> ${profile.gender || '—'}</div>
                                    <div><strong>Caste:</strong> ${profile.caste || '—'}</div>
                                    <div><strong>Language:</strong> ${profile.language || '—'}</div>
                                    <div><strong>City:</strong> ${profile.city || '—'}</div>
                                    <div><strong>Family Members:</strong> ${profile.familyMembers || '—'}</div>
                                    <div><strong>Family Type:</strong> ${profile.familyType || '—'}</div>
                                    <div><strong>Skin Color:</strong> ${profile.skinColor || '—'}</div>
                                    <div><strong>Reason:</strong> ${profile.reason || '—'}</div>
                                </div>
                            `;
                        })
                        .catch(() => {
                            adminProfileView.innerHTML = '<p>Unable to load profile details.</p>';
                        });
                }
            }
        }).catch(() => {
            localStorage.removeItem('purematchAdminToken');
            window.location.href = '/admin/login';
        });
    }
}

// Hero Contact Form Handler
const heroContactForm = document.getElementById('heroContactForm');
if (heroContactForm) {
heroContactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = e.target.querySelector('input[name="name"]').value;
    const email = e.target.querySelector('input[name="email"]').value;
    const phone = e.target.querySelector('input[name="phone"]').value;
    const reason = e.target.querySelector('select[name="reason"]').value;
    
    const submitBtn = e.target.querySelector('.form-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/submit-consultation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successMsg = document.getElementById('heroSuccessMessage');
            successMsg.style.display = 'flex';
            e.target.reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        } else {
            alert('Something went wrong. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection and try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});
}

// Main Consultation Form Handler
const consultationForm = document.getElementById('consultationForm');
if (consultationForm) {
consultationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const reason = document.getElementById('reason').value;
    const phone = document.querySelector('input[name="phone"]')?.value || '';
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/submit-consultation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, reason, phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successMsg = document.getElementById('consultationSuccessMessage');
            successMsg.style.display = 'flex';
            document.getElementById('consultationForm').reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        } else {
            alert('Something went wrong. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection and try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
        const navLinks = document.querySelector('.nav-links');
        const navToggle = document.querySelector('.nav-toggle');
        if (navLinks?.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle?.setAttribute('aria-expanded', 'false');
        }
    });
});// JavaScript Document

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.classList.toggle('active', isOpen);
    });
}

// WhatsApp popup behavior — initialize after DOM ready so elements exist
document.addEventListener('DOMContentLoaded', () => {
    const whatsappFab = document.getElementById('whatsappFab');
    const whatsappPopup = document.getElementById('whatsappPopup');
    const whatsappClose = document.getElementById('whatsappClose');
    const whatsappStart = document.getElementById('whatsappStart');
    const WHATSAPP_NUMBER = '+16306088477';
    const GREETING = "Assalamu alaikum, this is Rashid from Islamic Rishta App. How can I help you today?";

    function openWhatsAppChat() {
        const text = encodeURIComponent(GREETING);
        const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${text}`;
        window.open(url, '_blank');
    }

    if (whatsappFab && whatsappPopup) {
        whatsappFab.addEventListener('click', () => {
            if (whatsappPopup.classList.contains('open')) {
                whatsappPopup.classList.remove('open');
                whatsappPopup.style.display = 'none';
            } else {
                whatsappPopup.classList.add('open');
                whatsappPopup.style.display = 'block';
            }
        });
    }

    if (whatsappClose && whatsappPopup) {
        whatsappClose.addEventListener('click', () => {
            whatsappPopup.classList.remove('open');
            whatsappPopup.style.display = 'none';
        });
    }

    if (whatsappStart) {
        whatsappStart.addEventListener('click', () => openWhatsAppChat());
    }
});
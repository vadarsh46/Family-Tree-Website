document.addEventListener('DOMContentLoaded', function () {
    const profilesContainer = document.getElementById('profilesContainer');
    const newProfileNameInput = document.getElementById('newProfileName');
    const addProfileBtn = document.getElementById('addProfile');

    // Load profiles from localStorage
    function loadProfiles() {
        const profiles = JSON.parse(localStorage.getItem('familyProfiles') || '{}');
        profilesContainer.innerHTML = '';
        Object.keys(profiles).forEach(profileName => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            profileCard.innerHTML = `
                <div class="profile-name">${profileName}</div>
                <div class="profile-actions">
                    <button class="select-profile" data-profile="${profileName}">Select</button>
                    <button class="delete delete-profile" data-profile="${profileName}">Delete</button>
                </div>
            `;
            profilesContainer.appendChild(profileCard);
        });

        // Event listeners for select and delete buttons
        document.querySelectorAll('.select-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const profileName = btn.dataset.profile;
                sessionStorage.setItem('selectedProfile', profileName);
                window.location.href = 'page3.html';
            });
        });

        // Event listeners for delete buttons
        document.querySelectorAll('.delete-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const profileName = btn.dataset.profile;
                if (confirm(`Are you sure you want to delete the "${profileName}" family profile?`)) {
                    const profiles = JSON.parse(localStorage.getItem('familyProfiles') || '{}');
                    delete profiles[profileName];
                    localStorage.setItem('familyProfiles', JSON.stringify(profiles));
                    loadProfiles();
                }
            });
        });
    }

    // Add new profile
    addProfileBtn.addEventListener('click', () => {
        const profileName = newProfileNameInput.value.trim();
        if (!profileName) {
            alert('Please enter a family name');
            return;
        }
        const profiles = JSON.parse(localStorage.getItem('familyProfiles') || '{}');
        if (profiles[profileName]) {
            alert('Profile name already exists');
            return;
        }
        profiles[profileName] = { people: [], relationships: [] };
        localStorage.setItem('familyProfiles', JSON.stringify(profiles));
        newProfileNameInput.value = '';
        loadProfiles();
    });

    loadProfiles();
});

const hamburger = document.querySelector('.hamburger');
const navLink = document.querySelector('.nav__link');

hamburger.addEventListener('click', () => {
    navLink.classList.toggle('hide');
});

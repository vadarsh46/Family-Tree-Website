let people = []; // Array to store all person objects
let personId = 0; // Unique ID.

const treeContainer = document.getElementById("treeContainer");
const relatedSelect = document.getElementById("relatedTo");
const profileNameSpan = document.getElementById("profileName");
const backToProfilesBtn = document.getElementById("backToProfiles");
const exportImageBtn = document.getElementById("exportImage");
const deletePersonBtn = document.getElementById("deletePerson");

profileNameSpan.textContent = "Family Tree"; // Just a static label since no profiles

// Get selected profile from sessionStorage
const selectedProfile = sessionStorage.getItem('selectedProfile');

if (!selectedProfile) {
    alert("No profile selected. Redirecting...");
    window.location.href = "index.html";
} else {
    profileNameSpan.textContent = selectedProfile;
}

// Load profile data from localStorage
function loadProfileData() {
    const profiles = JSON.parse(localStorage.getItem('familyProfiles') || '{}');
    const profileData = profiles[selectedProfile];
    if (profileData) {
        people = profileData.people || [];
        personId = Math.max(...people.map(p => p.id), 0) || 0;
    } else {
        people = [];
        personId = 0;
    }
    updateDropdown();
    displayPeople();
}

// Save current tree data to localStorage under selected profile
function saveProfileData() {
    const profiles = JSON.parse(localStorage.getItem('familyProfiles') || '{}');
    profiles[selectedProfile] = {
        people: people,
        relationships: "auto-tracked via parents/children/spouse"
    };
    localStorage.setItem('familyProfiles', JSON.stringify(profiles));
}

function safePush(arr, id) {
    if (!arr.includes(id)) arr.push(id);
}

// Add Person
document.getElementById("addPerson").addEventListener("click", function () {
    const name = document.getElementById("name").value.trim();
    const gender = document.getElementById("gender").value;
    const relation = document.getElementById("relationship").value;
    const relatedTo = relatedSelect.value;

    if (!name) return alert("Enter a name");

    const existingPerson = people.find(p => p.name === name);
    if (existingPerson) {
        alert(`Person "${name}" already exists.`);
        return;
    }

    const newPerson = {
        id: ++personId,
        name,
        gender,
        generation: 0,
        spouse: null,
        children: [],
        parents: [],
        siblings: []
    };

    if (relation === "root" || people.length === 0) {
        newPerson.generation = 0;
    } else {
        const relPerson = people.find(p => p.id == relatedTo);
        if (!relPerson && relation !== "spouse") return alert("Select a valid related person");

        switch (relation) {
            case "child":
                newPerson.generation = relPerson.generation + 1;
                safePush(relPerson.children, newPerson.id);
                safePush(newPerson.parents, relPerson.id);

                if (relPerson.spouse) {
                    const sp = people.find(p => p.id === relPerson.spouse);
                    if (sp) {
                        safePush(sp.children, newPerson.id);
                        safePush(newPerson.parents, sp.id);
                    }
                }
                break;

            case "parent":
                newPerson.generation = relPerson.generation - 1;
                safePush(relPerson.parents, newPerson.id);
                safePush(newPerson.children, relPerson.id);

                if (relPerson.parents.length > 0) {
                    const existingParentId = relPerson.parents[0];
                    const existingParent = people.find(p => p.id === existingParentId);

                    if (existingParent && !existingParent.spouse && !newPerson.spouse) {
                        newPerson.spouse = existingParent.id;
                        existingParent.spouse = newPerson.id;
                    }
                }

                relPerson.siblings.forEach(sid => {
                    const sib = people.find(p => p.id === sid);
                    if (sib) {
                        safePush(sib.parents, newPerson.id);
                        safePush(newPerson.children, sib.id);
                    }
                });
                break;

            case "sibling":
                newPerson.generation = relPerson.generation;
                safePush(relPerson.siblings, newPerson.id);
                safePush(newPerson.siblings, relPerson.id);

                relPerson.parents.forEach(pid => {
                    const parentObj = people.find(p => p.id === pid);
                    if (parentObj) {
                        safePush(parentObj.children, newPerson.id);
                        safePush(newPerson.parents, parentObj.id);
                    }
                });
                break;

            case "spouse":
                if (relatedTo === "") {
                    alert("Please select a person married to.");
                    return;
                }
                if (relPerson.spouse) {
                    const currentSpouse = people.find(p => p.id === relPerson.spouse);
                    alert(`${relPerson.name} is already married to ${currentSpouse?.name || 'someone'}.`);
                    return;
                }

                newPerson.generation = relPerson.generation;

                if (!newPerson.spouse && !relPerson.spouse) {
                    newPerson.spouse = relPerson.id;
                    relPerson.spouse = newPerson.id;
                }

                relPerson.children.forEach(childId => {
                    safePush(newPerson.children, childId);
                    const child = people.find(p => p.id === childId);
                    if (child) safePush(child.parents, newPerson.id);
                });
                break;
        }
    }

    people.push(newPerson);
    updateDropdown();
    displayPeople();
    saveProfileData();
    alert(`Added: ${name}`);
    console.log("Current people:", people);
});

function buildTreeNode(person, rendered = new Set()) {
    // Avoid duplicate rendering of spouses
    if (rendered.has(person.id)) return null;
    if (person.spouse && rendered.has(person.spouse)) return null;

    const li = document.createElement('li');
    const box = document.createElement('div');
    box.className = 'person-box';

    // Show person + spouse together
    if (person.spouse) {
        const spouse = people.find(p => p.id === person.spouse);
        if (spouse) {
            box.textContent = `${person.name} & ${spouse.name}`;
            rendered.add(spouse.id); // mark spouse as already shown
        } else {
            box.textContent = person.name;
        }
    } else {
        box.textContent = person.name;
    }

    li.appendChild(box);

    // Show children only once
    if (person.children && person.children.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'tree';
        person.children.forEach(childId => {
            const child = people.find(p => p.id === childId);
            if (child) {
                const childNode = buildTreeNode(child, rendered);
                if (childNode) ul.appendChild(childNode);
            }
        });
        li.appendChild(ul)
    }

    rendered.add(person.id);
    return li;
}

// Display family tree
function displayPeople() {
    treeContainer.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree';

    const rendered = new Set();

    const roots = people.filter(p => p.parents.length === 0);

    roots.forEach(root => {
        // Skip if already rendered through spouse
        if (rendered.has(root.id) || (root.spouse && rendered.has(root.spouse))) {
            return;
        }

        const node = buildTreeNode(root, rendered);
        if (node) ul.appendChild(node);

        // Mark both partners as rendered
        rendered.add(root.id);
        if (root.spouse) rendered.add(root.spouse);
    });

    treeContainer.appendChild(ul);
}

// Update dropdown
function updateDropdown() {
    relatedSelect.innerHTML = '<option value="">-- Select Person --</option>';
    people.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.name}`;
        relatedSelect.appendChild(option);
    });
}

// Delete person
deletePersonBtn.addEventListener("click", () => {
    const selectedId = relatedSelect.value;
    if (!selectedId) {
        alert("Please select a person to delete.");
        return;
    }

    const person = people.find(p => p.id == selectedId);
    if (!person) return;

    const name = person.name;

    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }

    people = people.filter(p => p.id != selectedId);

    people.forEach(p => {
        p.children = p.children.filter(cid => cid != selectedId);
        p.parents = p.parents.filter(pid => pid != selectedId);
        p.siblings = p.siblings.filter(sid => sid != selectedId);
        if (p.spouse == selectedId) {
            p.spouse = null;
        }
    });

    updateDropdown();
    displayPeople();
    saveProfileData();
    alert(`"${name}" has been deleted.`);
});

exportImageBtn.addEventListener("click", () => {
    domtoimage.toPng(treeContainer)
        .then(function (dataUrl) {
            const link = document.createElement("a");
            link.download = "family-tree.png";
            link.href = dataUrl;
            link.click();
        })
        .catch(function (error) {
            console.error("Error exporting:", error);
        });
});

// Back button
backToProfilesBtn.addEventListener("click", function () {
    // alert("Back button clicked (no profiles to return to)");
});

loadProfileData();
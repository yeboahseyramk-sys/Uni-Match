// ===== UniMatch App =====

// ===== DEMO DATA =====
const demoProfiles = [
    {
        id: 1,
        name: "Emma",
        age: 20,
        faculty: "Psychology",
        bio: "Coffee lover, bookworm, and always down for a late-night study session. Looking for someone to explore the campus hidden spots with!",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
        interests: ["📚 Reading", "☕ Coffee", "🎵 Music", "📸 Photography"],
        online: true
    },
    {
        id: 2,
        name: "James",
        age: 22,
        faculty: "Computer Science",
        bio: "Full-stack developer by day, amateur chef by night. Let's grab bubble tea and debug code together.",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
        interests: ["💻 Tech", "🍳 Cooking", "🎮 Gaming", "☕ Coffee"],
        online: false
    },
    {
        id: 3,
        name: "Sophia",
        age: 21,
        faculty: "Fine Arts",
        bio: "Painting my way through college. I love sunsets, sketching in the park, and deep conversations about life.",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
        interests: ["🎨 Art", "📸 Photography", "✈️ Travel", "🎵 Music"],
        online: true
    },
    {
        id: 4,
        name: "Michael",
        age: 23,
        faculty: "Business",
        bio: "Entrepreneurship major with a passion for startups. Gym rat on weekends. Swipe right if you can keep up!",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
        interests: ["🏃 Fitness", "💼 Business", "✈️ Travel", "⚽ Sports"],
        online: true
    },
    {
        id: 5,
        name: "Olivia",
        age: 19,
        faculty: "Biology",
        bio: "Nature enthusiast and future vet. I spend my weekends at animal shelters or hiking trails.",
        photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
        interests: ["🐶 Animals", "🏃 Fitness", "📚 Reading", "🍳 Cooking"],
        online: false
    },
    {
        id: 6,
        name: "Daniel",
        age: 21,
        faculty: "Music",
        bio: "Guitarist in a campus band. Looking for my muse and someone to duet with at open mic nights.",
        photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=500&fit=crop",
        interests: ["🎵 Music", "🎬 Movies", "🎮 Gaming", "☕ Coffee"],
        online: true
    }
];

const demoMatches = [
    {
        id: 101,
        name: "Ava",
        photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
        lastMessage: "Haha that was so funny! 😂",
        time: "2m",
        unread: 2,
        messages: [
            { text: "Hey! I saw you're into photography too!", sent: false, time: "10:30 AM" },
            { text: "Yes! I love taking photos around campus", sent: true, time: "10:32 AM" },
            { text: "We should go on a photo walk sometime!", sent: false, time: "10:33 AM" },
            { text: "That sounds amazing! When are you free?", sent: true, time: "10:35 AM" },
            { text: "Haha that was so funny! 😂", sent: false, time: "10:36 AM" }
        ]
    },
    {
        id: 102,
        name: "Ryan",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
        lastMessage: "Same building! Let's meet at the library",
        time: "1h",
        unread: 1,
        messages: [
            { text: "Hey there! I noticed we're in the same faculty", sent: false, time: "9:00 AM" },
            { text: "Yeah! What year are you in?", sent: true, time: "9:15 AM" },
            { text: "Same building! Let's meet at the library", sent: false, time: "9:20 AM" }
        ]
    },
    {
        id: 103,
        name: "Mia",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
        lastMessage: "Can't wait for the concert! 🎵",
        time: "3h",
        unread: 0,
        messages: [
            { text: "Hi! I saw you like music too", sent: false, time: "Yesterday" },
            { text: "Yes! What's your favorite genre?", sent: true, time: "Yesterday" },
            { text: "Indie rock mostly. There's a concert next week!", sent: false, time: "Yesterday" },
            { text: "Can't wait for the concert! 🎵", sent: false, time: "Yesterday" }
        ]
    }
];

// ===== STATE =====
let currentScreen = 'screen-splash';
let currentProfileIndex = 0;
let currentChatId = null;
let selectedInterests = [];

// ===== NAVIGATION =====
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function showScreen(screenId) {
    navigateTo(screenId);
}

// ===== AUTH =====
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
        showToast('Please fill in all fields');
        return;
    }
    showToast('Welcome back!');
    setTimeout(() => navigateTo('screen-main'), 500);
    initDiscovery();
}

function signInWithGoogle() {
    // Demo: simulate Google OAuth sign-in
    showToast('Connecting to Google...');
    setTimeout(() => {
        showToast('Signed in with Google!');
        setTimeout(() => {
            navigateTo('screen-main');
            initDiscovery();
        }, 600);
    }, 1200);
}

function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-password').value;
    const pass2 = document.getElementById('signup-password2').value;
    const terms = document.getElementById('signup-terms');

    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email');
        return;
    }
    if (!pass || pass.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
    }
    if (pass !== pass2) {
        showToast('Passwords do not match');
        return;
    }
    if (!terms || !terms.checked) {
        showToast('Please agree to the Terms and Privacy Policy');
        return;
    }
    showToast('Account created!');
    setTimeout(() => navigateTo('screen-profile-setup'), 600);
}

// ===== PROFILE SETUP =====
function toggleInterest(el) {
    el.classList.toggle('selected');
    const interest = el.textContent;
    if (el.classList.contains('selected')) {
        selectedInterests.push(interest);
    } else {
        selectedInterests = selectedInterests.filter(i => i !== interest);
    }
}

function triggerPhotoUpload(slot) {
    // Simulate photo upload with Unsplash images
    const demoPhotos = [
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop"
    ];
    const randomPhoto = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
    slot.innerHTML = `<img src="${randomPhoto}" alt="Photo">`;
    slot.classList.add('has-photo');
}

function goToPreferences() {
    const name = document.getElementById('profile-name').value;
    if (!name) {
        showToast('Please enter your display name');
        return;
    }
    navigateTo('screen-preferences');
}

function selectPreference(btn) {
    document.querySelectorAll('.pref-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function updateAgeRange() {
    const min = document.getElementById('range-min').value;
    const max = document.getElementById('range-max').value;
    document.getElementById('age-min').textContent = min;
    document.getElementById('age-max').textContent = max;
}

function updateDistance() {
    const val = document.getElementById('distance-range').value;
    let text = 'On Campus';
    if (val < 3) text = 'Same Building';
    else if (val < 8) text = 'On Campus';
    else if (val < 20) text = 'Nearby Campus';
    else text = 'Whole City';
    document.getElementById('distance-value').textContent = text;
}

function goToPrivacySettings() {
    navigateTo('screen-privacy');
}

function completeOnboarding() {
    const terms = document.getElementById('terms-agree');
    if (!terms.checked) {
        showToast('Please agree to the Terms of Service');
        return;
    }
    showToast('Profile created! Let\'s find your match');
    setTimeout(() => {
        navigateTo('screen-main');
        initDiscovery();
    }, 800);
}

// ===== DISCOVERY / SWIPING =====
function initDiscovery() {
    renderCardStack();
    initMatchesScreen();
}

function renderCardStack() {
    const stack = document.getElementById('card-stack');
    stack.innerHTML = '';

    // Render next 3 cards
    for (let i = currentProfileIndex; i < Math.min(currentProfileIndex + 3, demoProfiles.length); i++) {
        const profile = demoProfiles[i];
        const card = createCard(profile, i === currentProfileIndex);
        stack.appendChild(card);
    }

    if (currentProfileIndex >= demoProfiles.length) {
        stack.innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <div style="font-size:60px; margin-bottom:16px;">🎉</div>
                <h3 style="margin-bottom:8px;">You're all caught up!</h3>
                <p style="color:var(--text-muted);">Check back later for more profiles</p>
            </div>
        `;
    }
}

function createCard(profile, isTop) {
    const card = document.createElement('div');
    card.className = 'profile-card' + (isTop ? ' enter' : '');
    card.dataset.profileId = profile.id;

    const interestsHtml = profile.interests.map(i =>
        `<span class="card-interest">${i}</span>`
    ).join('');

    card.innerHTML = `
        <div class="card-image" style="background-image: url('${profile.photo}')">
            <div class="card-photo-dots">
                <span class="card-photo-dot active"></span>
                <span class="card-photo-dot"></span>
                <span class="card-photo-dot"></span>
            </div>
            <div class="card-gradient"></div>
            <div class="swipe-label like-label">LIKE</div>
            <div class="swipe-label nope-label">NOPE</div>
        </div>
        <div class="card-info">
            <div class="card-name">${profile.name} <span class="card-age">${profile.age}</span></div>
            <div class="card-faculty"><i class="fas fa-graduation-cap"></i> ${profile.faculty}</div>
            <div class="card-bio">${profile.bio}</div>
            <div class="card-interests">${interestsHtml}</div>
        </div>
    `;

    if (isTop) {
        initSwipeGestures(card);
    } else {
        card.style.transform = `scale(${0.95 - (demoProfiles.indexOf(profile) - currentProfileIndex) * 0.03}) translateY(${(demoProfiles.indexOf(profile) - currentProfileIndex) * 10}px)`;
        card.style.opacity = `${0.7 - (demoProfiles.indexOf(profile) - currentProfileIndex) * 0.2}`;
    }

    return card;
}

function initSwipeGestures(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag, { passive: true });

    function startDrag(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        card.style.transition = 'none';
    }

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: true });

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        currentX = x - startX;
        const rotation = currentX * 0.05;
        card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

        if (currentX > 80) {
            card.classList.add('show-like');
            card.classList.remove('show-nope');
        } else if (currentX < -80) {
            card.classList.add('show-nope');
            card.classList.remove('show-like');
        } else {
            card.classList.remove('show-like', 'show-nope');
        }
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        if (currentX > 100) {
            card.classList.add('swiping-right');
            setTimeout(() => handleLike(), 300);
        } else if (currentX < -100) {
            card.classList.add('swiping-left');
            setTimeout(() => handlePass(), 300);
        } else {
            card.style.transform = '';
            card.classList.remove('show-like', 'show-nope');
        }
        currentX = 0;
    }
}

function swipeCard(direction) {
    const card = document.querySelector('.profile-card');
    if (!card) return;

    card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    if (direction === 'right') {
        card.classList.add('swiping-right');
        setTimeout(() => handleLike(), 400);
    } else {
        card.classList.add('swiping-left');
        setTimeout(() => handlePass(), 400);
    }
}

function handleLike() {
    const profile = demoProfiles[currentProfileIndex];
    currentProfileIndex++;

    // 30% chance of a match
    if (Math.random() < 0.3 && profile) {
        showMatchModal(profile);
        updateMatchesBadge(1);
    } else {
        showToast('You liked ' + (profile ? profile.name : ''));
    }

    setTimeout(() => renderCardStack(), 100);
}

function handlePass() {
    const profile = demoProfiles[currentProfileIndex];
    currentProfileIndex++;
    showToast('Passed');
    setTimeout(() => renderCardStack(), 100);
}

function rewindCard() {
    if (currentProfileIndex > 0) {
        currentProfileIndex--;
        renderCardStack();
        showToast('Rewound');
    } else {
        showToast('Nothing to rewind');
    }
}

function superLike() {
    const card = document.querySelector('.profile-card');
    if (!card) return;
    card.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    card.style.transform = 'translateY(-50px) scale(1.05)';
    setTimeout(() => {
        card.classList.add('swiping-right');
        setTimeout(() => {
            const profile = demoProfiles[currentProfileIndex];
            currentProfileIndex++;
            showMatchModal(profile);
            updateMatchesBadge(1);
            setTimeout(() => renderCardStack(), 100);
        }, 500);
    }, 200);
}

function boostProfile() {
    showToast('Boost activated! 🔥 Your profile will be shown to more people');
}

// ===== MATCH MODAL =====
function showMatchModal(profile) {
    if (!profile) return;
    document.getElementById('match-name').textContent = profile.name;
    document.getElementById('match-photo').src = profile.photo;
    document.getElementById('match-modal').classList.add('active');
}

function closeMatchModal() {
    document.getElementById('match-modal').classList.remove('active');
}

function openChatFromMatch() {
    closeMatchModal();
    const profile = demoProfiles[currentProfileIndex - 1];
    if (profile) {
        openChat({
            id: profile.id + 1000,
            name: profile.name,
            photo: profile.photo,
            messages: []
        });
    }
}

// ===== MATCHES & MESSAGES =====
function initMatchesScreen() {
    const newMatchesContainer = document.getElementById('new-matches');
    const messagesList = document.getElementById('messages-list');

    // New matches
    newMatchesContainer.innerHTML = demoMatches.map(match => `
        <div class="match-item" onclick="openChatById(${match.id})">
            <img src="${match.photo}" alt="${match.name}" class="match-photo-small">
            <span class="match-name">${match.name}</span>
        </div>
    `).join('');

    // Messages
    messagesList.innerHTML = demoMatches.map(match => `
        <div class="message-item" onclick="openChatById(${match.id})">
            <img src="${match.photo}" alt="${match.name}" class="message-avatar">
            <div class="message-preview">
                <h4>${match.name}</h4>
                <p>${match.lastMessage}</p>
            </div>
            <div class="message-meta">
                <span class="message-time">${match.time}</span>
                ${match.unread > 0 ? `<span class="unread-badge">${match.unread}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function openChatById(id) {
    const match = demoMatches.find(m => m.id === id);
    if (match) openChat(match);
}

function openChat(match) {
    currentChatId = match.id;
    document.getElementById('chat-name').textContent = match.name;
    document.getElementById('chat-avatar').src = match.photo;
    document.getElementById('chat-status').textContent = match.online ? 'Online' : 'Offline';

    renderMessages(match.messages || []);
    navigateTo('screen-chat');
}

function renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:var(--text-dim);">
                <div style="font-size:40px; margin-bottom:12px;">💬</div>
                <p>You matched! Say hello 👋</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="message-bubble ${msg.sent ? 'sent' : 'received'}">
            ${msg.text}
            <span class="message-time">${msg.time}</span>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const match = demoMatches.find(m => m.id === currentChatId);
    if (!match) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    if (!match.messages) match.messages = [];
    match.messages.push({ text, sent: true, time });
    match.lastMessage = text;
    match.time = 'now';

    input.value = '';
    renderMessages(match.messages);
    initMatchesScreen();

    // Simulate reply
    setTimeout(() => {
        const replies = [
            "That's awesome! 😊",
            "Haha totally!",
            "I'd love that!",
            "Same here!",
            "When are you free?",
            "That sounds fun!"
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        match.messages.push({ text: reply, sent: false, time: time });
        match.lastMessage = reply;
        renderMessages(match.messages);
        initMatchesScreen();
        updateMessagesBadge(1);
    }, 2000);
}

function handleChatKeypress(e) {
    if (e.key === 'Enter') sendMessage();
}

function closeChat() {
    navigateTo('screen-matches');
    currentChatId = null;
}

// ===== TABS =====
function switchTab(tab) {
    if (tab === 'discover') {
        navigateTo('screen-main');
    } else if (tab === 'matches') {
        navigateTo('screen-matches');
    } else if (tab === 'messages') {
        navigateTo('screen-matches');
    } else if (tab === 'settings') {
        navigateTo('screen-settings');
    }

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ===== FILTERS =====
function showFilterModal() {
    document.getElementById('filter-modal').classList.add('active');
}

function closeFilterModal() {
    document.getElementById('filter-modal').classList.remove('active');
}

function applyFilters() {
    closeFilterModal();
    showToast('Filters applied');
    currentProfileIndex = 0;
    renderCardStack();
}

document.querySelectorAll('.filter-option').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        tag.classList.toggle('active');
    });
});

// ===== PROFILE VIEW =====
function showEditProfile() {
    showToast('Edit profile coming soon');
}

function likeFromProfile() {
    showToast('You liked this profile!');
    navigateTo('screen-main');
}

// ===== SETTINGS =====
function logout() {
    showToast('Logged out successfully');
    setTimeout(() => navigateTo('screen-splash'), 800);
}

// ===== BADGES =====
function updateMatchesBadge(delta) {
    const badge = document.getElementById('matches-badge');
    let count = parseInt(badge.textContent) + delta;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function updateMessagesBadge(delta) {
    const badge = document.getElementById('messages-badge');
    let count = parseInt(badge.textContent) + delta;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

// ===== TOAST =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize demo badges
    document.getElementById('matches-badge').style.display = 'flex';
    document.getElementById('messages-badge').style.display = 'flex';
});

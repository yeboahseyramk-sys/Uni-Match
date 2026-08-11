// ===== UniMatch App - Production Version =====
// Configure your Supabase credentials below before deploying

const SUPABASE_URL = 'YOUR_SUPABASE_URL';      // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
let supabase = null;

// ===== STATE =====
let currentUser = null;
let currentProfile = null;
let currentScreen = 'screen-splash';
let currentProfileIndex = 0;
let currentChatId = null;
let selectedInterests = [];
let uploadedPhotos = [];
let faceVerificationPhoto = null;
let profiles = [];
let matches = [];
let messagesSubscription = null;
let cameraStream = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase if credentials are configured
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            if (currentProfile && currentProfile.photos && currentProfile.photos.length >= 3) {
                navigateTo('screen-main');
                await initDiscovery();
                await initMatchesScreen();
            } else {
                navigateTo('screen-profile-setup');
            }
        }
    }
    
    // Check for email verification redirect
    const hash = window.location.hash;
    if (hash.includes('access_token') || hash.includes('type=recovery')) {
        window.location.hash = '';
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                await loadUserProfile();
                if (currentProfile) {
                    navigateTo('screen-main');
                    await initDiscovery();
                } else {
                    navigateTo('screen-profile-setup');
                }
            }
        }
    }
    
    // Setup bio char counter
    const bioInput = document.getElementById('profile-bio');
    if (bioInput) {
        bioInput.addEventListener('input', function() {
            document.querySelector('.char-count').textContent = this.value.length + '/150';
        });
    }
    
    // Setup auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });
    
    // Initialize demo badges
    const matchesBadge = document.getElementById('matches-badge');
    const messagesBadge = document.getElementById('messages-badge');
    if (matchesBadge) matchesBadge.style.display = 'none';
    if (messagesBadge) messagesBadge.style.display = 'none';
});

// ===== NAVIGATION =====
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    currentScreen = screenId;
}

function showScreen(screenId) {
    navigateTo(screenId);
}

// ===== AUTH =====
async function handleLogin() {
    if (!supabase) {
        showToast('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app.js');
        return;
    }
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showToast('Please fill in all fields');
        return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        showToast('Login failed: ' + error.message);
        return;
    }
    
    currentUser = data.user;
    await loadUserProfile();
    if (currentProfile && currentProfile.photos && currentProfile.photos.length >= 3) {
        showToast('Welcome back!');
        navigateTo('screen-main');
        await initDiscovery();
        await initMatchesScreen();
    } else {
        navigateTo('screen-profile-setup');
    }
}

async function handleSignup() {
    if (!supabase) {
        showToast('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app.js');
        return;
    }
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const pass2 = document.getElementById('signup-password2').value;
    const terms = document.getElementById('signup-terms');
    
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email');
        return;
    }
    if (!password || password.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
    }
    if (password !== pass2) {
        showToast('Passwords do not match');
        return;
    }
    if (!terms || !terms.checked) {
        showToast('Please agree to the Terms and Privacy Policy');
        return;
    }
    
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: window.location.origin + '/?verified=true'
        }
    });
    
    if (error) {
        showToast('Signup failed: ' + error.message);
        return;
    }
    
    if (data.user && !data.user.email_confirmed_at) {
        // Email confirmation required
        navigateTo('screen-verify-email');
        document.getElementById('verify-email-address').textContent = email;
    } else {
        // Already confirmed (e.g., in development)
        currentUser = data.user;
        navigateTo('screen-profile-setup');
    }
}

async function checkVerification() {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showToast('Email verified! Welcome to UniMatch.');
        navigateTo('screen-profile-setup');
    } else {
        showToast('Email not yet verified. Please check your inbox and click the link.');
    }
}

async function resendVerification() {
    if (!supabase) return;
    const email = document.getElementById('verify-email-address').textContent;
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
    });
    if (error) {
        showToast('Error: ' + error.message);
    } else {
        showToast('Verification email resent!');
    }
}

async function signInWithGoogle() {
    if (!supabase) {
        showToast('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app.js');
        return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) {
        showToast('Google sign-in failed: ' + error.message);
    }
}

async function logout() {
    if (supabase) {
        await supabase.auth.signOut();
    }
    currentUser = null;
    currentProfile = null;
    uploadedPhotos = [];
    faceVerificationPhoto = null;
    selectedInterests = [];
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
        messagesSubscription = null;
    }
    stopCamera();
    showToast('Logged out successfully');
    setTimeout(() => navigateTo('screen-splash'), 800);
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

function handlePhotoUpload(event, slot) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        uploadedPhotos.push(dataUrl);
        slot.innerHTML = `<img src="${dataUrl}" alt="Photo">`;
        slot.classList.add('has-photo');
        updatePhotoCount();
    };
    reader.readAsDataURL(file);
}

function triggerPhotoUpload(slot) {
    // Create hidden file input
    let input = slot.querySelector('input[type="file"]');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.onchange = (e) => handlePhotoUpload(e, slot);
        slot.appendChild(input);
    }
    input.click();
}

function updatePhotoCount() {
    const count = uploadedPhotos.length;
    const hint = document.querySelector('.photo-hint');
    if (hint) {
        hint.textContent = `${count} of 3 photos uploaded${count >= 3 ? ' ✓' : ''}`;
        hint.style.color = count >= 3 ? 'var(--success)' : 'var(--text-dim)';
    }
}

function goToPreferences() {
    const name = document.getElementById('profile-name').value.trim();
    const dob = document.getElementById('profile-dob').value;
    const gender = document.getElementById('profile-gender').value;
    
    if (!name) {
        showToast('Please enter your display name');
        return;
    }
    if (!dob) {
        showToast('Please enter your date of birth');
        return;
    }
    if (!gender) {
        showToast('Please select your gender');
        return;
    }
    if (uploadedPhotos.length < 3) {
        showToast(`Please upload at least 3 photos (${uploadedPhotos.length}/3)`);
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

async function completeOnboarding() {
    if (!supabase || !currentUser) {
        showToast('Supabase not configured. Please set up your backend.');
        return;
    }
    
    const terms = document.getElementById('terms-agree');
    if (!terms || !terms.checked) {
        showToast('Please agree to the Terms of Service');
        return;
    }
    
    const name = document.getElementById('profile-name').value.trim();
    const dob = document.getElementById('profile-dob').value;
    const gender = document.getElementById('profile-gender').value;
    const faculty = document.getElementById('profile-faculty').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    const birthDate = new Date(dob);
    const age = Math.floor((Date.now() - birthDate.getTime()) / 31557600000);
    
    const prefBtn = document.querySelector('.pref-option.selected');
    const interestedIn = prefBtn ? prefBtn.textContent : 'Everyone';
    
    const privacy = {
        hideAge: document.getElementById('hide-age')?.checked || false,
        restrictVisibility: document.getElementById('restrict-visibility')?.checked || false,
        incognito: document.getElementById('incognito')?.checked || false,
        twoFA: document.getElementById('2fa')?.checked || false
    };
    
    const profileData = {
        user_id: currentUser.id,
        email: currentUser.email,
        name,
        dob,
        age,
        gender,
        faculty,
        bio,
        interests: selectedInterests,
        photos: uploadedPhotos,
        face_verification: faceVerificationPhoto,
        interested_in: interestedIn,
        age_min: parseInt(document.getElementById('range-min').value) || 18,
        age_max: parseInt(document.getElementById('range-max').value) || 25,
        max_distance: parseInt(document.getElementById('distance-range').value) || 5,
        privacy_settings: privacy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('profiles').upsert(profileData);
    if (error) {
        showToast('Error saving profile: ' + error.message);
        return;
    }
    
    currentProfile = profileData;
    showToast('Profile created! Let\'s find your match');
    setTimeout(async () => {
        navigateTo('screen-main');
        await initDiscovery();
        await initMatchesScreen();
    }, 800);
}

async function loadUserProfile() {
    if (!supabase || !currentUser) return;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
    
    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error loading profile:', error);
        }
        return;
    }
    currentProfile = data;
    if (currentProfile.photos) uploadedPhotos = currentProfile.photos;
}

// ===== FACE VERIFICATION =====
async function goToFaceVerification() {
    if (!supabase || !currentUser) {
        showToast('Supabase not configured. Please set up your backend.');
        return;
    }
    
    const name = document.getElementById('profile-name').value.trim();
    const dob = document.getElementById('profile-dob').value;
    const gender = document.getElementById('profile-gender').value;
    
    if (!name || !dob || !gender) {
        showToast('Please fill in all required fields first');
        return;
    }
    if (uploadedPhotos.length < 3) {
        showToast(`Please upload at least 3 photos first (${uploadedPhotos.length}/3)`);
        return;
    }
    
    navigateTo('screen-face-verify');
    await initCamera();
}

async function initCamera() {
    const video = document.getElementById('face-camera');
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false 
        });
        video.srcObject = cameraStream;
        video.style.display = 'block';
        document.getElementById('face-preview').style.display = 'none';
        document.getElementById('btn-capture-face').style.display = 'inline-block';
        document.getElementById('btn-retake-face').style.display = 'none';
        document.getElementById('btn-confirm-face').style.display = 'none';
    } catch (err) {
        showToast('Camera access denied. Please allow camera access to continue.');
        console.error('Camera error:', err);
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const video = document.getElementById('face-camera');
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
}

function captureFace() {
    const video = document.getElementById('face-camera');
    const canvas = document.getElementById('face-canvas');
    const preview = document.getElementById('face-preview');
    
    if (!video || !canvas || !video.videoWidth) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    faceVerificationPhoto = canvas.toDataURL('image/jpeg', 0.9);
    preview.src = faceVerificationPhoto;
    preview.style.display = 'block';
    video.style.display = 'none';
    
    document.getElementById('btn-capture-face').style.display = 'none';
    document.getElementById('btn-retake-face').style.display = 'inline-block';
    document.getElementById('btn-confirm-face').style.display = 'inline-block';
    
    stopCamera();
}

function retakeFace() {
    faceVerificationPhoto = null;
    initCamera();
}

function confirmFace() {
    if (!faceVerificationPhoto) {
        showToast('Please take a selfie first');
        return;
    }
    showToast('Face verification captured!');
    navigateTo('screen-preferences');
}

// ===== DISCOVERY / SWIPING =====
async function initDiscovery() {
    await loadProfiles();
}

async function loadProfiles() {
    if (!supabase || !currentUser) return;
    
    // Get IDs of users already liked/passed
    const { data: likes } = await supabase
        .from('likes')
        .select('liked_user_id')
        .eq('user_id', currentUser.id);
    
    const excludedIds = (likes || []).map(l => l.liked_user_id);
    excludedIds.push(currentUser.id);
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'in', '(' + excludedIds.join(',') + ')')
        .limit(50);
    
    if (error) {
        console.error('Error loading profiles:', error);
        // Fallback to demo data if Supabase not ready
        profiles = getDemoProfiles();
    } else {
        profiles = data || [];
    }
    
    currentProfileIndex = 0;
    renderCardStack();
}

function getDemoProfiles() {
    return [
        { id: 'demo-1', user_id: 'demo-1', name: 'Emma', age: 20, faculty: 'Psychology', bio: 'Coffee lover, bookworm, and always down for a late-night study session.', photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop'], interests: ['📚 Reading', '☕ Coffee', '🎵 Music'], online: true },
        { id: 'demo-2', user_id: 'demo-2', name: 'James', age: 22, faculty: 'Computer Science', bio: 'Full-stack developer by day, amateur chef by night.', photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'], interests: ['💻 Tech', '🍳 Cooking', '🎮 Gaming'], online: false },
        { id: 'demo-3', user_id: 'demo-3', name: 'Sophia', age: 21, faculty: 'Fine Arts', bio: 'Painting my way through college. I love sunsets and sketching.', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'], interests: ['🎨 Art', '📸 Photography', '✈️ Travel'], online: true },
        { id: 'demo-4', user_id: 'demo-4', name: 'Michael', age: 23, faculty: 'Business', bio: 'Entrepreneurship major with a passion for startups.', photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'], interests: ['🏃 Fitness', '💼 Business', '⚽ Sports'], online: true },
        { id: 'demo-5', user_id: 'demo-5', name: 'Olivia', age: 19, faculty: 'Biology', bio: 'Nature enthusiast and future vet. I spend weekends at animal shelters.', photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'], interests: ['🐶 Animals', '🏃 Fitness', '📚 Reading'], online: false },
        { id: 'demo-6', user_id: 'demo-6', name: 'Daniel', age: 21, faculty: 'Music', bio: 'Guitarist in a campus band. Looking for my muse.', photos: ['https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=500&fit=crop'], interests: ['🎵 Music', '🎬 Movies', '🎮 Gaming'], online: true }
    ];
}

function renderCardStack() {
    const stack = document.getElementById('card-stack');
    stack.innerHTML = '';
    
    for (let i = currentProfileIndex; i < Math.min(currentProfileIndex + 3, profiles.length); i++) {
        const profile = profiles[i];
        const card = createCard(profile, i === currentProfileIndex);
        stack.appendChild(card);
    }
    
    if (currentProfileIndex >= profiles.length) {
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
    card.dataset.profileId = profile.id || profile.user_id;
    
    const photo = (profile.photos && profile.photos[0]) || profile.photo || '';
    const interests = profile.interests || [];
    const interestsHtml = interests.slice(0, 4).map(i =>
        `<span class="card-interest">${i}</span>`
    ).join('');
    
    const onlineStatus = profile.online ? '<span class="online-dot"></span>' : '';
    
    card.innerHTML = `
        <div class="card-image" style="background-image: url('${photo}')">
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
            <div class="card-name">${onlineStatus}${profile.name} <span class="card-age">${profile.age}</span></div>
            <div class="card-faculty"><i class="fas fa-graduation-cap"></i> ${profile.faculty || ''}</div>
            <div class="card-bio">${profile.bio || ''}</div>
            <div class="card-interests">${interestsHtml}</div>
        </div>
    `;
    
    if (isTop) {
        initSwipeGestures(card);
    } else {
        // Cards behind are clearly visible, no blur or heavy opacity reduction
        const offset = (profiles.indexOf(profile) - currentProfileIndex);
        card.style.transform = `scale(${0.96 - offset * 0.02}) translateY(${offset * 8}px)`;
        card.style.opacity = '0.92';
        card.style.pointerEvents = 'none';
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

async function handleLike() {
    const profile = profiles[currentProfileIndex];
    if (!profile) return;
    
    currentProfileIndex++;
    
    // Save like to database
    if (supabase && currentUser) {
        await supabase.from('likes').insert({
            user_id: currentUser.id,
            liked_user_id: profile.user_id,
            liked: true
        });
        
        // Check if it's a mutual match
        const { data: mutualLike } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', profile.user_id)
            .eq('liked_user_id', currentUser.id)
            .eq('liked', true)
            .single();
        
        if (mutualLike) {
            // Create match
            const { data: match } = await supabase.from('matches').insert({
                user1_id: currentUser.id,
                user2_id: profile.user_id
            }).select().single();
            
            if (match) {
                showMatchModal(profile);
                updateMatchesBadge(1);
            }
        } else {
            showToast('You liked ' + profile.name);
        }
    } else {
        // Fallback without Supabase
        showToast('You liked ' + profile.name);
    }
    
    setTimeout(() => renderCardStack(), 100);
}

async function handlePass() {
    const profile = profiles[currentProfileIndex];
    if (!profile) return;
    
    currentProfileIndex++;
    
    if (supabase && currentUser) {
        await supabase.from('likes').insert({
            user_id: currentUser.id,
            liked_user_id: profile.user_id,
            liked: false
        });
    }
    
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
            const profile = profiles[currentProfileIndex];
            if (profile) {
                currentProfileIndex++;
                showMatchModal(profile);
                updateMatchesBadge(1);
            }
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
    const photo = (profile.photos && profile.photos[0]) || profile.photo || '';
    document.getElementById('match-photo').src = photo;
    document.getElementById('match-modal').classList.add('active');
}

function closeMatchModal() {
    document.getElementById('match-modal').classList.remove('active');
}

function openChatFromMatch() {
    closeMatchModal();
    const profile = profiles[currentProfileIndex - 1];
    if (profile) {
        openChat({
            id: 'match-' + profile.user_id,
            user_id: profile.user_id,
            name: profile.name,
            photo: (profile.photos && profile.photos[0]) || profile.photo || ''
        });
    }
}

// ===== MATCHES & MESSAGES =====
async function initMatchesScreen() {
    if (supabase && currentUser) {
        await loadMatchesFromDB();
    } else {
        loadDemoMatches();
    }
}

async function loadMatchesFromDB() {
    if (!supabase || !currentUser) return;
    
    const { data, error } = await supabase
        .from('matches')
        .select(`
            id,
            user1_id,
            user2_id,
            created_at,
            user1:profiles!matches_user1_id_fkey(name, photos),
            user2:profiles!matches_user2_id_fkey(name, photos)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
    
    if (error) {
        console.error('Error loading matches:', error);
        loadDemoMatches();
        return;
    }
    
    matches = (data || []).map(m => {
        const isUser1 = m.user1_id === currentUser.id;
        const otherUser = isUser1 ? m.user2 : m.user1;
        return {
            id: m.id,
            user_id: isUser1 ? m.user2_id : m.user1_id,
            name: otherUser?.name || 'Unknown',
            photo: otherUser?.photos?.[0] || '',
            lastMessage: 'Say hello! 👋',
            time: 'Just now',
            unread: 0,
            messages: []
        };
    });
    
    renderMatches();
}

function loadDemoMatches() {
    matches = [
        { id: 'demo-match-1', user_id: 'demo-101', name: 'Ava', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', lastMessage: 'You matched! Say hello 👋', time: 'Just now', unread: 0, messages: [] },
        { id: 'demo-match-2', user_id: 'demo-102', name: 'Ryan', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', lastMessage: 'You matched! Say hello 👋', time: 'Just now', unread: 0, messages: [] },
        { id: 'demo-match-3', user_id: 'demo-103', name: 'Mia', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', lastMessage: 'You matched! Say hello 👋', time: 'Just now', unread: 0, messages: [] }
    ];
    renderMatches();
}

function renderMatches() {
    const newMatchesContainer = document.getElementById('new-matches');
    const messagesList = document.getElementById('messages-list');
    
    if (!newMatchesContainer || !messagesList) return;
    
    // New matches
    newMatchesContainer.innerHTML = matches.slice(0, 6).map(match => `
        <div class="match-item" onclick="openChatById('${match.id}')">
            <img src="${match.photo}" alt="${match.name}" class="match-photo-small" loading="lazy">
            <span class="match-name">${match.name}</span>
        </div>
    `).join('');
    
    // Messages
    messagesList.innerHTML = matches.map(match => `
        <div class="message-item" onclick="openChatById('${match.id}')">
            <img src="${match.photo}" alt="${match.name}" class="message-avatar" loading="lazy">
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
    const match = matches.find(m => m.id === id);
    if (match) openChat(match);
}

async function openChat(match) {
    currentChatId = match.id;
    document.getElementById('chat-name').textContent = match.name;
    document.getElementById('chat-avatar').src = match.photo || '';
    document.getElementById('chat-status').textContent = 'Online';
    
    // Load messages from database
    if (supabase && match.id && !match.id.startsWith('demo-')) {
        await loadMessages(match.id);
        subscribeToMessages(match.id);
    } else {
        renderMessages(match.messages || []);
    }
    
    navigateTo('screen-chat');
}

async function loadMessages(matchId) {
    if (!supabase || !matchId) return;
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error loading messages:', error);
        return;
    }
    renderMessages(data || []);
}

function renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:var(--text-dim);">
                <div style="font-size:40px; margin-bottom:12px;">💬</div>
                <p>You matched! Say hello 👋</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        const isSent = msg.sender_id === (currentUser?.id || 'demo');
        const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : msg.time || '';
        return `
            <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                ${msg.content || msg.text}
                <span class="message-time">${time}</span>
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

function subscribeToMessages(matchId) {
    if (!supabase || !matchId) return;
    
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
    }
    
    messagesSubscription = supabase
        .channel('messages:' + matchId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: 'match_id=eq.' + matchId
        }, payload => {
            const msg = payload.new;
            if (msg.sender_id === currentUser?.id) return; // Skip own messages (already rendered)
            
            const container = document.getElementById('chat-messages');
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble received';
            bubble.innerHTML = `${msg.content}<span class="message-time">${new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>`;
            container.appendChild(bubble);
            container.scrollTop = container.scrollHeight;
            
            // Update match preview
            const match = matches.find(m => m.id === matchId);
            if (match) {
                match.lastMessage = msg.content;
                match.time = 'Just now';
                renderMatches();
            }
        })
        .subscribe();
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    const match = matches.find(m => m.id === currentChatId);
    if (!match) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Add message to UI immediately (optimistic)
    const container = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble sent';
    bubble.innerHTML = `${text}<span class="message-time">${timeStr}</span>`;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    
    input.value = '';
    
    // Update match preview
    match.lastMessage = text;
    match.time = 'Just now';
    renderMatches();
    
    // Send to database if Supabase is configured
    if (supabase && currentUser && !match.id.startsWith('demo-')) {
        const { error } = await supabase.from('messages').insert({
            match_id: match.id,
            sender_id: currentUser.id,
            content: text
        });
        if (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message');
        }
    }
    
    // NO BOT REPLIES - Only real users can send messages
}

function handleChatKeypress(e) {
    if (e.key === 'Enter') sendMessage();
}

function closeChat() {
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
        messagesSubscription = null;
    }
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
    const clickedEl = event && event.currentTarget ? event.currentTarget : null;
    if (clickedEl) {
        clickedEl.classList.add('active');
    } else {
        // Try to highlight the correct nav item based on current screen
        const screenToNav = {
            'screen-main': 0,
            'screen-matches': 1,
            'screen-settings': 3
        };
        const navIdx = screenToNav[currentScreen];
        if (navIdx !== undefined) {
            const navItems = document.querySelectorAll('.bottom-nav .nav-item');
            if (navItems[navIdx]) navItems[navIdx].classList.add('active');
        }
    }
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
function showSettingsSection(section) {
    showToast(section + ' coming soon');
}

// ===== BADGES =====
function updateMatchesBadge(delta) {
    const badge = document.getElementById('matches-badge');
    if (!badge) return;
    let count = parseInt(badge.textContent || 0) + delta;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function updateMessagesBadge(delta) {
    const badge = document.getElementById('messages-badge');
    if (!badge) return;
    let count = parseInt(badge.textContent || 0) + delta;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

// ===== TOAST =====
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}
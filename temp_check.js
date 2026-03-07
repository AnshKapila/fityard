let submitContactForm = null;
document.addEventListener('kite:core-ready', (e) => {
  submitContactForm = e.detail.submitContactForm;
});

// Routes that start with a light (white) background — navbar defaults to light variant
const LIGHT_BG_ROUTES = ['/contact'];
const data = JSON.parse(document.getElementById('content').textContent);
const app = document.getElementById('app');

// ─── UTILS ────────────────────────────────────────────────────
function getImg(id, width = 800) {
  const asset = data.assets.find(a => a.id === id);
  if (!asset) return '';
  return asset.url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}

function setCopyright() {
  document.getElementById('copyright').textContent = `© ${new Date().getFullYear()} ${data.company.name}. All rights reserved.`;
}

// Logo URLs for dark/light backgrounds
const LOGO_WHITE = 'https://static.kite.ai/image/upload/e_trim/v1772789557/app/0a268b1a-133a-43c1-a8bd-63f260f63982/remove-white-background-make-it-c6bc5d-nobg.png';
const LOGO_BLACK = 'https://static.kite.ai/image/upload/e_trim/v1772789557/app/0a268b1a-133a-43c1-a8bd-63f260f63982/remove-white-background-make-it-5e9c54-nobg.png';

function setNavLogo(useDarkLogo) {
  const logoImg = document.getElementById('nav-logo-img');
  if (logoImg) {
    logoImg.src = useDarkLogo ? LOGO_BLACK : LOGO_WHITE;
  }
}

function initLogo() {
  // Footer always uses white logo (dark background)
  const footerLogo = document.getElementById('footer-logo-img');
  if (footerLogo) {
    footerLogo.src = LOGO_WHITE;
  }
}

// ─── ROUTER ───────────────────────────────────────────────────
const routes = {
  '/': { title: 'Home', render: renderHome },
  '/about': { title: 'About Us', render: renderAbout },
  '/training': { title: 'Training Zones', render: renderTraining },
  '/gallery': { title: 'Gallery', render: renderGallery },
  '/contact': { title: 'Contact', render: renderContact },
};

const siteName = data.company.name;

function handleNav(e, path) {
  e.preventDefault();
  if (path === location.pathname) return;
  history.pushState({}, '', path);
  render(path);
  document.getElementById('mobile-menu').classList.add('translate-x-full');
}

function handleFooterNav(e) {
  e.preventDefault();
  history.pushState({}, '', '/');
  render('/');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render(path) {
  const route = routes[path] || routes['/'];
  document.title = `${route.title} | ${siteName}`;

  document.querySelectorAll('[data-nav]').forEach(link => {
    const isActive = link.getAttribute('href') === path;
    link.classList.toggle('text-brand-red', isActive);
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
  route.render();

  lucide.createIcons();
  initScrollReveal();
  initParallax();
  initMembershipObserver();
  initTestimonialCarousel();
  initButtonHovers();
  // Re-evaluate navbar base state for the new route (scroll is now 0)
  initStickyHeader();
}

// ─── SCROLL REVEAL ────────────────────────────────────────────
// ─── GLOBAL BUTTON HOVER TAGGING ──────────────────────────────
function initButtonHovers() {
  document.querySelectorAll('a, button').forEach(el => {
    // Skip nav-cta and already-tagged elements
    if (el.classList.contains('nav-cta') || el.classList.contains('btn-primary') || el.classList.contains('btn-secondary')) return;

    const cls = el.className || '';

    // Primary: red background buttons
    if (cls.includes('bg-brand-red') || cls.includes('bg-red')) {
      el.classList.add('btn-primary');
      return;
    }

    const hasPadding = /\bpx-\d/.test(cls) || /\bpy-\d/.test(cls);
    const hasRounded = cls.includes('rounded-full') || cls.includes('rounded-xl') || cls.includes('rounded-lg');

    // Dark solid buttons (black bg) that are CTAs
    if (hasPadding && hasRounded && (cls.includes('bg-brand-black') || cls.includes('bg-black') || cls.includes('bg-gray-900'))) {
      el.classList.add('btn-secondary');
      return;
    }

    // Ghost / bordered buttons
    const hasBorder = cls.includes('border') && !cls.includes('border-b') && !cls.includes('border-t') && !cls.includes('border-l') && !cls.includes('border-r');
    const isButton = el.tagName === 'BUTTON' || (el.tagName === 'A' && hasPadding && hasRounded);

    if (isButton && hasBorder) {
      el.classList.add('btn-secondary');
    }
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── TESTIMONIAL CAROUSEL ─────────────────────────────────────
function initTestimonialCarousel() {
  const carousel = document.getElementById('testimonial-carousel');
  if (!carousel) return;

  // IntersectionObserver for scroll-triggered animation
  const carouselObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          carousel.classList.add('is-active');
        } else {
          carousel.classList.remove('is-active');
        }
      });
    },
    { threshold: 0.2 }
  );
  carouselObserver.observe(carousel);

  // Video hover/tap functionality
  const portraits = carousel.querySelectorAll('.floating-portrait');
  portraits.forEach(portrait => {
    const video = portrait.querySelector('video');
    const videoSrc = portrait.dataset.videoSrc;

    // Mouse/touch events for video play
    const playVideo = () => {
      if (video && videoSrc) {
        if (!video.src) video.src = videoSrc;
        video.play().catch(() => {});
        portrait.classList.add('video-active');
      }
    };

    const pauseVideo = () => {
      if (video) {
        video.pause();
        portrait.classList.remove('video-active');
      }
    };

    // Desktop: hover
    portrait.addEventListener('mouseenter', playVideo);
    portrait.addEventListener('mouseleave', pauseVideo);

    // Mobile: tap to toggle
    portrait.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (portrait.classList.contains('video-active')) {
        pauseVideo();
      } else {
        // Pause other videos first
        portraits.forEach(p => {
          if (p !== portrait) {
            p.querySelector('video')?.pause();
            p.classList.remove('video-active');
          }
        });
        playVideo();
      }
    }, { passive: false });
  });
}

// ─── STICKY HEADER SCROLL ─────────────────────────────────────
function initStickyHeader() {
  const navbar = document.getElementById('navbar');

  function updateNav() {
    const isLightRoute = LIGHT_BG_ROUTES.includes(location.pathname);
    const baseClass = isLightRoute ? 'nav-light' : 'nav-transparent';

    if (window.scrollY > 50) {
      navbar.classList.remove('nav-transparent', 'nav-light');
      navbar.classList.add('nav-scrolled');
      // Scrolled state has dark bg, use white logo
      setNavLogo(false);
    } else {
      navbar.classList.remove('nav-scrolled', 'nav-transparent', 'nav-light');
      navbar.classList.add(baseClass);
      // Use dark logo on light backgrounds, white logo on dark backgrounds
      setNavLogo(isLightRoute);
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
}

// ─── PAGE RENDERERS ───────────────────────────────────────────

function renderHome() {
  app.innerHTML = `
    <!-- 1. HERO SECTION -->
    <section class="relative min-h-screen flex items-center overflow-hidden">
      <!-- Background with subtle parallax -->
      <div class="absolute inset-0 overflow-hidden">
        <img src="https://static.kite.ai/image/upload/a_hflip/v1772798560/app/0a268b1a-133a-43c1-a8bd-63f260f63982/qvanqoxlendwznkaypyo.png" data-parallax="0.08" class="w-full h-[115%] object-cover" alt="group training session at FitYard Fitness Academy Rohini Delhi" onerror="this.onerror=null; this.src='https://static.kite.ai/image/upload/v1772798560/app/0a268b1a-133a-43c1-a8bd-63f260f63982/qvanqoxlendwznkaypyo.png';">
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

      <!-- Content Container - Left Aligned -->
      <div class="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-10 py-32 md:py-40">
        <div class="max-w-2xl">

          <!-- Social Proof Cluster -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 reveal">
            <div class="flex items-center">
              <div class="flex -space-x-3" role="group" aria-label="Happy gym members">
                <img src="${getImg('testimonial_user1_img', 80)}" class="w-10 h-10 rounded-full border-2 border-brand-black object-cover" alt="Gym member Rahul">
                <img src="${getImg('testimonial_user2_img', 80)}" class="w-10 h-10 rounded-full border-2 border-brand-black object-cover" alt="Gym member Priya">
                <img src="${getImg('trainer_1_img', 80)}" class="w-10 h-10 rounded-full border-2 border-brand-black object-cover" alt="Head Coach Vikram">
                <img src="${getImg('trainer_2_img', 80)}" class="w-10 h-10 rounded-full border-2 border-brand-black object-cover" alt="Trainer Anjali">
              </div>
              <div class="ml-4 flex items-center gap-1.5">
                <div class="flex gap-0.5">
                  <i data-lucide="star" class="w-4 h-4 text-brand-red fill-brand-red"></i>
                  <i data-lucide="star" class="w-4 h-4 text-brand-red fill-brand-red"></i>
                  <i data-lucide="star" class="w-4 h-4 text-brand-red fill-brand-red"></i>
                  <i data-lucide="star" class="w-4 h-4 text-brand-red fill-brand-red"></i>
                  <i data-lucide="star" class="w-4 h-4 text-brand-red fill-brand-red"></i>
                </div>
                <span class="text-white/80 text-sm font-manrope ml-1">5.0</span>
              </div>
            </div>
            <span class="text-white/60 text-sm font-manrope">Trusted by Rohini families</span>
          </div>

          <!-- Main Headline -->
          <div class="mb-8 reveal delay-100">
            <h1 class="text-white uppercase tracking-tight leading-[0.95]">
              <span class="block font-anton text-5xl md:text-6xl lg:text-7xl mb-2">Movement Based</span>
              <span class="block font-rubik text-4xl md:text-5xl lg:text-6xl leading-[1]">Fitness Training in Rohini</span>
            </h1>
          </div>

          <!-- Media Strip - Pill Style -->
          <div class="flex items-center gap-2 mb-8 reveal delay-150">
            <a href="#instagram"
               aria-label="See real training moments — scroll to Instagram section"
               class="media-strip-pill bg-white/10 backdrop-blur-sm rounded-full p-1.5 pr-4 gap-2"
               onclick="event.preventDefault(); document.getElementById('instagram')?.scrollIntoView({behavior:'smooth'})">
              <div class="flex -space-x-1">
                <div class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-black/40">
                  <img src="https://static.kite.ai/image/upload/v1772799635/app/0a268b1a-133a-43c1-a8bd-63f260f63982/zwvxdvgmikjmxxgjhexa.png" class="media-strip-img" alt="Movement training at FitYard Fitness Academy Rohini">
                </div>
                <div class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-black/40">
                  <img src="https://static.kite.ai/image/upload/v1772799651/app/0a268b1a-133a-43c1-a8bd-63f260f63982/ejrwvbgpc7e1estpwfpa.png" class="media-strip-img" alt="Boxing coaching at FitYard Fitness Academy Rohini">
                </div>
                <div class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-black/40">
                  <img src="https://static.kite.ai/image/upload/v1772799658/app/0a268b1a-133a-43c1-a8bd-63f260f63982/i6bcheifvxaxsjhftxyp.png" class="media-strip-img" alt="Kids gymnastics at FitYard Fitness Academy Rohini">
                </div>
              </div>
              <span class="text-white/70 text-xs font-manrope">Real training moments</span>
              <i data-lucide="instagram" class="w-4 h-4 text-white/60 ml-1"></i>
            </a>
          </div>

          <!-- Supporting Paragraph -->
          <p class="text-base md:text-lg text-gray-300 font-inter mb-10 max-w-xl leading-relaxed reveal delay-200">
            Gymnastics, martial arts, calisthenics and functional training for kids and adults. Build strength, confidence, and discipline at our Rohini fitness academy.
          </p>

          <!-- Primary CTA - Smaller -->
          <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white font-semibold rounded-3xl text-sm hover:bg-red-400 transition-colors reveal delay-300">
            Book a Trial Session
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>

        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <i data-lucide="chevron-down" class="w-7 h-7 text-white/50"></i>
      </div>
    </section>

    <!-- 2. IDENTITY / ABOUT -->
    <section class="py-24 bg-white">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-16 items-center">
          <div class="reveal">
            <span class="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-6">Who We Are</span>
            <h2 class="text-4xl md:text-5xl font-rubik leading-tight mb-8">A MOVEMENT-BASED FITNESS ACADEMY.</h2>
            <p class="text-lg text-gray-600 mb-6 leading-relaxed">
              FitYard is not a typical machine-based gym. We are a movement-focused fitness academy specializing in gymnastics, martial arts, calisthenics and functional training.
            </p>
            <p class="text-lg text-gray-600 leading-relaxed">
              Located in Prashant Vihar, Rohini, we offer programs for kids, beginners, athletes and adults looking to build real strength, skill and confidence.
            </p>
          </div>
          <div class="reveal delay-200">
            <div class="rounded-[2rem] overflow-hidden img-zoom-container aspect-[4/3]">
              <img src="${getImg('about_hero_img', 800)}" class="w-full h-full object-cover" alt="group movement training at FitYard Fitness Academy Rohini Delhi">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. TRAINING PHILOSOPHY -->
    <section class="py-24 bg-brand-black text-white">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="text-center mb-16 reveal">
          <h2 class="text-4xl md:text-5xl font-rubik mb-4">OUR PHILOSOPHY</h2>
          <p class="text-gray-400 max-w-2xl mx-auto">Movement mastery. Skill development. Discipline and confidence through training.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="glass-card overflow-hidden flex flex-col h-[360px] reveal delay-100" tabindex="0">
            <div class="h-[180px] flex-shrink-0 relative overflow-hidden">
              <img src="https://static.kite.ai/image/upload/v1772799635/app/0a268b1a-133a-43c1-a8bd-63f260f63982/zwvxdvgmikjmxxgjhexa.png" class="w-full h-full object-cover object-center philosophy-img" alt="Movement training at FitYard Fitness Academy Rohini Delhi">
              <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div class="flex-1 flex flex-col justify-center text-center px-7 py-6">
              <h3 class="text-xl font-bold font-manrope mb-3">Movement-Based Training</h3>
              <p class="text-gray-400 text-sm">Train your body to move naturally with gymnastics, calisthenics, and functional fitness.</p>
            </div>
          </div>
          <div class="glass-card overflow-hidden flex flex-col h-[360px] reveal delay-200" tabindex="0">
            <div class="h-[180px] flex-shrink-0 relative overflow-hidden">
              <img src="https://static.kite.ai/image/upload/v1772799651/app/0a268b1a-133a-43c1-a8bd-63f260f63982/ejrwvbgpc7e1estpwfpa.png" class="w-full h-full object-cover object-center philosophy-img" alt="Boxing coaching at FitYard Fitness Academy Rohini Delhi">
              <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div class="flex-1 flex flex-col justify-center text-center px-7 py-6">
              <h3 class="text-xl font-bold font-manrope mb-3">Skill Development</h3>
              <p class="text-gray-400 text-sm">Master techniques progressively under expert guidance from certified coaches.</p>
            </div>
          </div>
          <div class="glass-card overflow-hidden flex flex-col h-[360px] reveal delay-300" tabindex="0">
            <div class="h-[180px] flex-shrink-0 relative overflow-hidden">
              <img src="https://static.kite.ai/image/upload/v1772799658/app/0a268b1a-133a-43c1-a8bd-63f260f63982/i6bcheifvxaxsjhftxyp.png" class="w-full h-full object-cover object-center philosophy-img" alt="Kids gymnastics at FitYard Fitness Academy Rohini Delhi">
              <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div class="flex-1 flex flex-col justify-center text-center px-7 py-6">
              <h3 class="text-xl font-bold font-manrope mb-3">Discipline &amp; Confidence</h3>
              <p class="text-gray-400 text-sm">Build mental strength alongside physical ability in a supportive community.</p>
            </div>
          </div>
        </div>
        <!-- End CTA -->
        <div class="text-center mt-12 reveal">
          <a href="/about" onclick="handleNav(event, '/about')" class="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-3xl hover:border-brand-red hover:text-brand-red transition-all duration-300">
            Explore Our Approach <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- 4. TRAINING PROGRAMS -->
    <section class="py-24 bg-white">
      <div class="max-w-[1400px] mx-auto px-6">
        <div class="text-center mb-16 reveal">
          <h2 class="text-4xl md:text-5xl font-rubik mb-4">TRAINING PROGRAMS</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">Skill-driven training for all ages in Rohini — from kids athletics to sport performance and martial arts combat.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="h-[400px] lg:h-[500px] rounded-[2rem] feature-card reveal delay-100">
            <div class="feature-card-bg" style="background-image: url('https://static.kite.ai/image/upload/v1772796856/app/0a268b1a-133a-43c1-a8bd-63f260f63982/yiu4r2unauprgsyoycow.png');"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
              <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">KIDS</span>
              <h3 class="text-2xl font-manrope font-bold mb-2">Kids Athletic Development</h3>
              <p class="text-gray-300 text-sm">Gymnastics, coordination drills, and sport-based play for children. Build confidence, discipline, and a lifelong love of movement.</p>
            </div>
            <span class="sr-only">kids gymnastics and movement training at FitYard Fitness Academy Rohini Delhi</span>
          </div>
          <div class="h-[400px] lg:h-[500px] rounded-[2rem] feature-card reveal delay-200">
            <div class="feature-card-bg" style="background-image: url('https://static.kite.ai/image/upload/v1772797134/app/0a268b1a-133a-43c1-a8bd-63f260f63982/rgauu8mofqwa9wprfzyr.png');"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
              <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">SPORT FITNESS</span>
              <h3 class="text-2xl font-manrope font-bold mb-2">Sport Fitness</h3>
              <p class="text-gray-300 text-sm">Gymnastics fundamentals, calisthenics, CrossFit conditioning, and strength training — all focused on real athletic performance.</p>
            </div>
            <span class="sr-only">calisthenics and strength conditioning at FitYard Fitness Academy Rohini Delhi</span>
          </div>
          <div class="h-[400px] lg:h-[500px] rounded-[2rem] feature-card reveal delay-300">
            <div class="feature-card-bg" style="background-image: url('https://static.kite.ai/image/upload/v1772797634/app/0a268b1a-133a-43c1-a8bd-63f260f63982/ciqsvgxh3jvknc7pfmdn.png');"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
              <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">COMBAT</span>
              <h3 class="text-2xl font-manrope font-bold mb-2">Combat Training</h3>
              <p class="text-gray-300 text-sm">MMA and kickboxing with expert skill training, fight conditioning, and the discipline to back it up.</p>
            </div>
            <span class="sr-only">kickboxing and MMA training at FitYard Fitness Academy Rohini Delhi</span>
          </div>
        </div>
        <!-- End CTA -->
        <div class="text-center mt-12 reveal">
          <a href="/training" onclick="handleNav(event, '/training')" class="inline-flex items-center gap-2 px-8 py-4 border-2 border-black/20 text-brand-black font-semibold rounded-3xl hover:border-brand-black hover:bg-brand-black hover:text-white transition-all duration-200">
            View All Programs <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- 5. MEMBER PROOF / TESTIMONIALS -->
    <section id="testimonials-section" class="py-24 bg-brand-black text-white overflow-hidden">
      <div class="max-w-[1400px] mx-auto px-6">
        <!-- Section Title -->
        <h2 class="text-4xl md:text-5xl font-rubik text-center mb-16 reveal">MEMBER RESULTS</h2>

        <!-- Floating Portrait Carousel -->
        <div class="testimonial-carousel mb-12" id="testimonial-carousel">
          <div class="testimonial-carousel-track">
            <!-- First set of portraits -->
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('testimonial_user1_img', 300)}" alt="Rahul, FitYard Academy student" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('trainer_1_img', 300)}" alt="Vikram Singh, Head Coach" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('testimonial_user2_img', 300)}" alt="Priya, FitYard Academy student" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('trainer_2_img', 300)}" alt="Anjali Mehta, Senior Trainer" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_1_img', 300)}" alt="Training moment at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_3_img', 300)}" alt="Combat training at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_5_img', 300)}" alt="Movement training at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_6_img', 300)}" alt="Boxing coaching at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <!-- Duplicate for seamless loop -->
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('testimonial_user1_img', 300)}" alt="Rahul, FitYard Academy student" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('trainer_1_img', 300)}" alt="Vikram Singh, Head Coach" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('testimonial_user2_img', 300)}" alt="Priya, FitYard Academy student" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('trainer_2_img', 300)}" alt="Anjali Mehta, Senior Trainer" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_1_img', 300)}" alt="Training moment at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_3_img', 300)}" alt="Combat training at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_5_img', 300)}" alt="Movement training at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
            <div class="floating-portrait" data-video-src="">
              <img src="${getImg('gallery_6_img', 300)}" alt="Boxing coaching at FitYard Fitness Academy Rohini Delhi" class="portrait-poster">
              <video muted playsinline loop preload="none"></video>
              <div class="portrait-play-icon">
                <i data-lucide="play" class="w-3 h-3 text-white"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Existing Text Testimonials -->
        <div class="max-w-[1200px] mx-auto">
          <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-white/5 p-8 rounded-[2rem] border border-white/10 reveal delay-100">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-full overflow-hidden img-zoom-container">
                <img src="${getImg('testimonial_user1_img', 100)}" class="w-full h-full object-cover" alt="Arun">
              </div>
              <div>
                <h4 class="font-bold font-manrope">Arun S.</h4>
                <p class="text-xs text-gray-500">Parent, Rohini</p>
              </div>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed">"My son's confidence has transformed since joining the kids gymnastics program. The coaches are patient and skilled."</p>
          </div>

          <div class="bg-white/5 p-8 rounded-[2rem] border border-white/10 reveal delay-200">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-full overflow-hidden img-zoom-container">
                <img src="${getImg('testimonial_user2_img', 100)}" class="w-full h-full object-cover" alt="Sneha">
              </div>
              <div>
                <h4 class="font-bold font-manrope">Sneha M.</h4>
                <p class="text-xs text-gray-500">Prashant Vihar</p>
              </div>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed">"The MMA training here is top-notch. I've built real discipline and strength in just 3 months."</p>
          </div>

          <div class="bg-white/5 p-8 rounded-[2rem] border border-white/10 reveal delay-300">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                <i data-lucide="user" class="w-6 h-6 text-gray-500"></i>
              </div>
              <div>
                <h4 class="font-bold font-manrope">Vikram T.</h4>
                <p class="text-xs text-gray-500">Sector 14, Rohini</p>
              </div>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed">"Best fitness academy in Rohini for kids. Both my daughters love the gymnastics classes here."</p>
          </div>
        </div>
        <!-- End CTA -->
        <div class="text-center mt-12 reveal">
          <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-8 py-4 bg-brand-red text-white font-bold rounded-3xl hover:bg-red-400 transition-colors" aria-label="Contact us to start your fitness journey">
            Contact Us <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- 6. MEMBERSHIP STRUCTURE (NO PRICING) - Sticky Scroll -->
    <section id="membership-section" class="py-24 bg-brand-black text-white">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="text-center mb-16 reveal">
          <h2 class="text-4xl md:text-5xl font-rubik mb-4">MEMBERSHIP OPTIONS</h2>
          <p class="text-gray-400 max-w-2xl mx-auto">Simple, transparent structure. No hidden fees.</p>
        </div>

        <!-- Desktop: Two-column with sticky left -->
        <div class="hidden lg:grid lg:grid-cols-[280px_1fr] gap-16">
          <!-- Sticky Left Column -->
          <div class="sticky top-32 self-start h-fit">
            <div id="membership-sticky" class="text-center py-8">
              <span id="membership-step-label" class="text-sm font-manrope font-semibold text-brand-red uppercase tracking-wider mb-2 block transition-all duration-300">Step 1</span>
              <span id="membership-step-num" class="font-anton text-8xl text-brand-red transition-all duration-300 block">01</span>
            </div>
          </div>

          <!-- Scrollable Right Column -->
          <div class="space-y-8">
            <!-- Panel 1 -->
            <div class="membership-panel p-10 bg-white/5 rounded-[2rem] border border-white/10 relative" data-step="1" data-icon="sparkles">
              <div class="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <i data-lucide="sparkles" class="w-6 h-6 text-gray-400"></i>
              </div>
              <h3 class="text-3xl font-manrope font-bold mb-4 pr-16">Guided First Session</h3>
              <p class="text-gray-300 mb-6 leading-relaxed">Begin with a complimentary one-on-one session where our trainers assess your current fitness level, discuss your goals, and create a roadmap tailored just for you.</p>
              <ul class="space-y-2 mb-8">
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Full fitness assessment
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Personalized goal setting
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  No commitment required
                </li>
              </ul>
              <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm hover:bg-red-400 transition-colors">
                Book Your First Session
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            </div>

            <!-- Panel 2 -->
            <div class="membership-panel p-10 bg-white/5 rounded-[2rem] border border-white/10 relative" data-step="2" data-icon="calendar">
              <div class="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <i data-lucide="calendar" class="w-6 h-6 text-gray-400"></i>
              </div>
              <h3 class="text-3xl font-manrope font-bold mb-4 pr-16">Monthly Access</h3>
              <p class="text-gray-300 mb-6 leading-relaxed">Unlock unlimited access to all training zones, premium equipment, and amenities. Train whenever you want with flexible hours that fit your schedule.</p>
              <ul class="space-y-2 mb-8">
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  All zones included
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Flexible scheduling
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Premium amenities
                </li>
              </ul>
              <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm hover:bg-red-400 transition-colors">
                Book Your First Session
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            </div>

            <!-- Panel 3 -->
            <div class="membership-panel p-10 bg-white/5 rounded-[2rem] border border-white/10 relative" data-step="3" data-icon="user-check">
              <div class="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <i data-lucide="user-check" class="w-6 h-6 text-gray-400"></i>
              </div>
              <h3 class="text-3xl font-manrope font-bold mb-4 pr-16">Coaching Add-On</h3>
              <p class="text-gray-300 mb-6 leading-relaxed">Accelerate your progress with dedicated one-on-one coaching sessions. Our certified trainers provide personalized guidance, form correction, and accountability.</p>
              <ul class="space-y-2 mb-8">
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Personal trainer sessions
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Custom workout plans
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Progress tracking
                </li>
              </ul>
              <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm hover:bg-red-400 transition-colors">
                Book Your First Session
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            </div>

            <!-- Panel 4 -->
            <div class="membership-panel p-10 bg-white/5 rounded-[2rem] border border-white/10 relative" data-step="4" data-icon="users">
              <div class="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <i data-lucide="users" class="w-6 h-6 text-gray-400"></i>
              </div>
              <h3 class="text-3xl font-manrope font-bold mb-4 pr-16">Small Group Training</h3>
              <p class="text-gray-300 mb-6 leading-relaxed">Train alongside like-minded individuals in small, focused groups. Get the energy of community training with the attention of personalized coaching.</p>
              <ul class="space-y-2 mb-8">
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Max 6 people per group
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Community motivation
                </li>
                <li class="flex items-center gap-3 text-gray-400 text-sm">
                  <i data-lucide="check" class="w-4 h-4 text-brand-green"></i>
                  Structured programs
                </li>
              </ul>
              <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm hover:bg-red-400 transition-colors">
                Book Your First Session
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Mobile/Tablet: Stacked Layout -->
        <div class="lg:hidden space-y-8">
          <!-- Mobile Panel 1 -->
          <div class="p-8 bg-white/5 rounded-[2rem] border border-white/10 reveal delay-100 relative">
            <div class="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <i data-lucide="sparkles" class="w-5 h-5 text-gray-400"></i>
            </div>
            <div class="mb-4">
              <span class="text-xs font-manrope font-semibold text-brand-red uppercase tracking-wider">Step 1</span>
              <span class="font-anton text-3xl text-brand-red ml-2">01</span>
            </div>
            <h3 class="text-2xl font-manrope font-bold mb-3 pr-12">Guided First Session</h3>
            <p class="text-gray-300 text-sm mb-4 leading-relaxed">Begin with a complimentary one-on-one session to assess your goals.</p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>Full fitness assessment</li>
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>No commitment</li>
            </ul>
            <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm">Book Your First Session <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          </div>

          <!-- Mobile Panel 2 -->
          <div class="p-8 bg-white/5 rounded-[2rem] border border-white/10 reveal delay-200 relative">
            <div class="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <i data-lucide="calendar" class="w-5 h-5 text-gray-400"></i>
            </div>
            <div class="mb-4">
              <span class="text-xs font-manrope font-semibold text-brand-red uppercase tracking-wider">Step 2</span>
              <span class="font-anton text-3xl text-brand-red ml-2">02</span>
            </div>
            <h3 class="text-2xl font-manrope font-bold mb-3 pr-12">Monthly Access</h3>
            <p class="text-gray-300 text-sm mb-4 leading-relaxed">Unlimited access to all training zones and amenities.</p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>All zones included</li>
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>Flexible scheduling</li>
            </ul>
            <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm">Book Your First Session <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          </div>

          <!-- Mobile Panel 3 -->
          <div class="p-8 bg-white/5 rounded-[2rem] border border-white/10 reveal delay-300 relative">
            <div class="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <i data-lucide="user-check" class="w-5 h-5 text-gray-400"></i>
            </div>
            <div class="mb-4">
              <span class="text-xs font-manrope font-semibold text-brand-red uppercase tracking-wider">Step 3</span>
              <span class="font-anton text-3xl text-brand-red ml-2">03</span>
            </div>
            <h3 class="text-2xl font-manrope font-bold mb-3 pr-12">Coaching Add-On</h3>
            <p class="text-gray-300 text-sm mb-4 leading-relaxed">Dedicated one-on-one coaching with certified trainers.</p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>Personal trainer</li>
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>Progress tracking</li>
            </ul>
            <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm">Book Your First Session <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          </div>

          <!-- Mobile Panel 4 -->
          <div class="p-8 bg-white/5 rounded-[2rem] border border-white/10 reveal delay-400 relative">
            <div class="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <i data-lucide="users" class="w-5 h-5 text-gray-400"></i>
            </div>
            <div class="mb-4">
              <span class="text-xs font-manrope font-semibold text-brand-red uppercase tracking-wider">Step 4</span>
              <span class="font-anton text-3xl text-brand-red ml-2">04</span>
            </div>
            <h3 class="text-2xl font-manrope font-bold mb-3 pr-12">Small Group Training</h3>
            <p class="text-gray-300 text-sm mb-4 leading-relaxed">Train alongside like-minded individuals in focused groups.</p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>Max 6 per group</li>
              <li class="flex items-center gap-2 text-gray-400 text-sm"><i data-lucide="check" class="w-4 h-4 text-brand-green"></i>Community motivation</li>
            </ul>
            <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-3xl text-sm">Book Your First Session <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. INSTAGRAM PRESENCE -->
    <section id="instagram" class="py-24 bg-gradient-to-b from-brand-black via-gray-900 to-brand-black text-white">
      <div class="max-w-[1200px] mx-auto px-6">
        <!-- Two Column Layout -->
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <!-- Left: Text Content -->
          <div class="text-center lg:text-left reveal">
            <span class="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-manrope font-semibold text-brand-red mb-6">
              <i data-lucide="instagram" class="w-4 h-4 inline mr-2"></i>Follow the Journey
            </span>
            <h2 class="text-4xl md:text-5xl font-rubik mb-4">TRAINING IN<br class="hidden md:block"> EVERY POST.</h2>
            <p class="text-gray-400 max-w-xl mx-auto lg:mx-0 text-lg mb-8">Kids classes, martial arts drills, and community training moments. Follow FitYard for daily fitness inspiration.</p>

            <!-- Highlight Tags -->
            <div class="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-manrope text-gray-300">
                <i data-lucide="flame" class="w-4 h-4 inline mr-1.5 text-brand-orange"></i>Kids Training
              </span>
              <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-manrope text-gray-300">
                <i data-lucide="trophy" class="w-4 h-4 inline mr-1.5 text-brand-red"></i>Martial Arts
              </span>
              <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-manrope text-gray-300">
                <i data-lucide="heart" class="w-4 h-4 inline mr-1.5 text-brand-green"></i>Community
              </span>
            </div>

            <!-- CTA Button -->
            <a href="https://instagram.com/fityardfitness" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 text-white font-manrope font-semibold rounded-3xl hover:border-brand-red hover:text-brand-red transition-all duration-300 group">
              <i data-lucide="instagram" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
              Follow Us on Instagram
              <i data-lucide="external-link" class="w-4 h-4 opacity-50"></i>
            </a>
          </div>

          <!-- Right: Phone Mockup -->
          <div class="flex justify-center lg:justify-end reveal delay-200">
            <div class="relative z-10">
              <!-- Decorative Glow (behind phone) -->
              <div class="absolute inset-0 -m-16 bg-gradient-to-r from-brand-red/20 via-brand-orange/15 to-pink-500/20 blur-3xl rounded-full pointer-events-none"></div>

              <!-- Phone Frame -->
              <div class="relative w-[280px] md:w-[300px] bg-black rounded-[3rem] p-3 shadow-2xl shadow-black/50 border border-white/20">
                <!-- Dynamic Island -->
                <div class="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20"></div>

                <!-- Screen -->
                <div class="relative rounded-[2.25rem] overflow-hidden">
                  <img src="https://static.kite.ai/image/upload/v1772800926/app/0a268b1a-133a-43c1-a8bd-63f260f63982/bwwnbnxetm2islhmglka.png" alt="FitYard Delhi Instagram profile screenshot" class="w-full block">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. BOOKING + LOCATION -->
    <section class="py-24 bg-white">
      <div class="max-w-[1400px] mx-auto px-6">
        <!-- Main Dark Container -->
        <div class="bg-brand-black rounded-[2rem] overflow-hidden reveal">
          <div class="grid lg:grid-cols-2">

            <!-- LEFT: Image Panel -->
            <div class="relative h-[350px] lg:h-auto lg:min-h-[650px] rounded-l-[2rem] overflow-hidden contact-image-panel">
              <img src="https://static.kite.ai/image/upload/v1772803118/app/0a268b1a-133a-43c1-a8bd-63f260f63982/kccppctaqyy0ohztuipu.jpg" alt="movement training session at FitYard Fitness Academy Rohini Delhi" class="absolute inset-0 w-full h-full object-cover object-center">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

              <!-- Contact Cards at bottom of image -->
              <div class="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-3">
                <a href="tel:+919990655542" class="flex items-center gap-3 bg-brand-red hover:bg-red-600 text-white px-5 py-3 rounded-xl transition-colors flex-1 justify-center sm:justify-start">
                  <i data-lucide="phone" class="w-5 h-5"></i>
                  <span class="font-semibold">+91 9990655542</span>
                </a>
                <a href="https://wa.me/919990655542?text=Hi%20FitYard!%20I'm%20interested%20in%20booking%20a%20trial%20session." target="_blank" class="flex items-center gap-3 bg-brand-red hover:bg-red-600 text-white px-5 py-3 rounded-xl transition-colors flex-1 justify-center sm:justify-start">
                  <i data-lucide="message-circle" class="w-5 h-5"></i>
                  <span class="font-semibold">WhatsApp Us</span>
                </a>
              </div>
            </div>

            <!-- RIGHT: Form Panel -->
            <div class="p-8 lg:p-12 text-white">
              <span class="inline-block px-3 py-1 bg-brand-red/20 text-brand-red text-xs font-bold rounded-full mb-4 uppercase tracking-wide">Get in Touch</span>
              <h2 class="text-3xl md:text-4xl font-rubik mb-3">START YOUR MOVEMENT JOURNEY</h2>
              <p class="text-gray-400 mb-8">Book a trial session at FitYard Fitness Academy, Rohini.</p>

              <form id="booking-form" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Name</label>
                    <input type="text" name="name" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:border-brand-red focus:outline-none transition-colors" placeholder="Your name">
                  </div>
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Phone</label>
                    <input type="tel" name="phone" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:border-brand-red focus:outline-none transition-colors" placeholder="+91">
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Age Group</label>
                    <select name="age" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white focus:border-brand-red focus:outline-none transition-colors appearance-none">
                      <option value="" class="bg-brand-black">Select age group</option>
                      <option value="Kids 5-8" class="bg-brand-black">Kids (5-8 years)</option>
                      <option value="Kids 9-12" class="bg-brand-black">Kids (9-12 years)</option>
                      <option value="Teens 13-17" class="bg-brand-black">Teens (13-17 years)</option>
                      <option value="Adults 18+" class="bg-brand-black">Adults (18+ years)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Program Interest</label>
                    <select name="goal" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white focus:border-brand-red focus:outline-none transition-colors appearance-none">
                      <option value="" class="bg-brand-black">Select program</option>
                      <option value="Gymnastics" class="bg-brand-black">Gymnastics Training</option>
                      <option value="MMA" class="bg-brand-black">MMA Training</option>
                      <option value="Kickboxing" class="bg-brand-black">Kickboxing Classes</option>
                      <option value="CrossFit" class="bg-brand-black">CrossFit Conditioning</option>
                      <option value="Strength" class="bg-brand-black">Strength Training</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-bold mb-2 text-gray-300">Preferred Time</label>
                  <select name="time" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white focus:border-brand-red focus:outline-none transition-colors appearance-none">
                    <option value="" class="bg-brand-black">Select time</option>
                    <option value="6AM-9AM" class="bg-brand-black">Morning (6AM-9AM)</option>
                    <option value="9AM-12PM" class="bg-brand-black">Late Morning (9AM-12PM)</option>
                    <option value="12PM-4PM" class="bg-brand-black">Afternoon (12PM-4PM)</option>
                    <option value="4PM-7PM" class="bg-brand-black">Evening (4PM-7PM)</option>
                    <option value="7PM-10PM" class="bg-brand-black">Night (7PM-10PM)</option>
                  </select>
                </div>
                <button type="submit" class="w-full py-4 bg-brand-red text-white font-bold text-lg rounded-3xl hover:bg-red-600 transition-colors mt-2">
                  Book Trial Session
                </button>
              </form>

              <!-- Success State -->
              <div id="booking-success" class="hidden mt-6 p-6 bg-brand-green/20 border border-brand-green/30 rounded-xl">
                <div class="flex items-center gap-3 mb-4">
                  <i data-lucide="check-circle" class="w-6 h-6 text-brand-green"></i>
                  <span class="font-bold text-brand-green">Booking Request Sent!</span>
                </div>
                <p class="text-gray-300 text-sm mb-4">We will contact you shortly to confirm your session.</p>
                <a id="whatsapp-link" href="#" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                  Continue on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Location Info Below -->
        <div class="mt-16 reveal delay-200">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl md:text-4xl font-rubik mb-6">FIND US</h2>
              <div class="space-y-4 text-gray-600">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i data-lucide="map-pin" class="w-5 h-5 text-brand-red"></i>
                  </div>
                  <div>
                    <p class="font-bold text-brand-black">FitYard Fitness Academy</p>
                    <p>A1/16 Prashant Vihar, Rohini, Delhi</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i data-lucide="clock" class="w-5 h-5 text-brand-red"></i>
                  </div>
                  <div>
                    <p class="font-bold text-brand-black">Hours</p>
                    <p>Mon-Sat: 6AM - 10PM | Sun: 8AM - 2PM</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-[1.5rem] overflow-hidden h-[300px] lg:h-[350px] shadow-xl">
              <iframe src="${data.company.mapUrl}" class="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500" allowfullscreen="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  attachBookingForm();
}

// ─── SHARED INSTAGRAM SECTION ─────────────────────────────────
function renderInstagramSection() {
  return `
    <!-- INSTAGRAM PRESENCE -->
    <section id="instagram" class="py-24 bg-gradient-to-b from-brand-black via-gray-900 to-brand-black text-white">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <!-- Left: Text Content -->
          <div class="text-center lg:text-left reveal">
            <span class="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-manrope font-semibold text-brand-red mb-6">
              <i data-lucide="instagram" class="w-4 h-4 inline mr-2"></i>Follow the Journey
            </span>
            <h2 class="text-4xl md:text-5xl font-rubik mb-4">TRAINING IN<br class="hidden md:block"> EVERY POST.</h2>
            <p class="text-gray-400 max-w-xl mx-auto lg:mx-0 text-lg mb-8">Kids classes, martial arts drills, and community training moments. Follow FitYard for daily fitness inspiration.</p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-manrope text-gray-300">
                <i data-lucide="flame" class="w-4 h-4 inline mr-1.5 text-brand-orange"></i>Kids Training
              </span>
              <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-manrope text-gray-300">
                <i data-lucide="trophy" class="w-4 h-4 inline mr-1.5 text-brand-red"></i>Martial Arts
              </span>
              <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-manrope text-gray-300">
                <i data-lucide="heart" class="w-4 h-4 inline mr-1.5 text-brand-green"></i>Community
              </span>
            </div>
            <a href="https://instagram.com/fityardfitness" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 text-white font-manrope font-semibold rounded-3xl hover:border-brand-red hover:text-brand-red transition-all duration-300 group">
              <i data-lucide="instagram" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
              Follow Us on Instagram
              <i data-lucide="external-link" class="w-4 h-4 opacity-50"></i>
            </a>
          </div>
          <!-- Right: Phone Mockup -->
          <div class="flex justify-center lg:justify-end reveal delay-200">
            <div class="relative z-10">
              <div class="absolute inset-0 -m-16 bg-gradient-to-r from-brand-red/20 via-brand-orange/15 to-pink-500/20 blur-3xl rounded-full pointer-events-none"></div>
              <div class="relative w-[280px] md:w-[300px] bg-black rounded-[3rem] p-3 shadow-2xl shadow-black/50 border border-white/20">
                <div class="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20"></div>
                <div class="relative rounded-[2.25rem] overflow-hidden">
                  <img src="https://static.kite.ai/image/upload/v1772800926/app/0a268b1a-133a-43c1-a8bd-63f260f63982/bwwnbnxetm2islhmglka.png" alt="FitYard Delhi Instagram profile screenshot" class="w-full block">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAbout() {
  app.innerHTML = `
    <!-- HERO -->
    <section class="relative h-[70vh] min-h-[500px] flex items-end pb-16 px-6">
      <div class="absolute inset-0 img-zoom-container">
        <img src="${getImg('about_hero_img', 1600)}" class="w-full h-full object-cover" alt="group movement training at FitYard Fitness Academy Rohini Delhi">
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      <div class="relative z-10 max-w-[1400px] mx-auto w-full reveal">
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-rubik text-white mb-4">MOVEMENT.<br>SKILL. DISCIPLINE.</h1>
        <p class="text-white/80 text-xl max-w-xl">A fitness academy dedicated to building strength, confidence, and character.</p>
      </div>
    </section>

    <!-- MISSION -->
    <section class="py-24 px-6 bg-white">
      <div class="max-w-[1000px] mx-auto text-center">
        <span class="text-sm font-bold tracking-widest text-brand-orange uppercase mb-4 block reveal">Our Mission</span>
        <p class="text-2xl md:text-4xl font-manrope font-medium leading-tight reveal delay-100">
          FitYard Fitness Academy exists to provide movement-based training for all ages. From kids gymnastics to adult MMA, we focus on skill development, not machines - building confident, capable individuals.
        </p>
      </div>
    </section>

    <!-- TEAM -->
    <section class="py-24 bg-brand-black text-white">
      <div class="max-w-[1400px] mx-auto px-6">
        <h2 class="text-4xl font-rubik mb-16 text-center reveal">MEET OUR COACHES</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="bg-white/5 p-8 rounded-[2rem] text-center reveal delay-100 group border border-white/10">
            <div class="w-40 h-40 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white/20 group-hover:border-brand-red transition-colors img-zoom-container">
              <img src="${getImg('trainer_1_img', 400)}" class="w-full h-full object-cover" alt="Vikram">
            </div>
            <h3 class="text-xl font-bold font-manrope mb-1">Vikram Singh</h3>
            <p class="text-brand-red font-bold text-xs uppercase tracking-wider mb-4">Head Coach</p>
            <p class="text-gray-400 text-sm">Specialist in MMA, kickboxing, and functional conditioning.</p>
          </div>
          <div class="bg-white/5 p-8 rounded-[2rem] text-center reveal delay-200 group border border-white/10">
            <div class="w-40 h-40 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white/20 group-hover:border-brand-red transition-colors img-zoom-container">
              <img src="${getImg('trainer_2_img', 400)}" class="w-full h-full object-cover" alt="Anjali">
            </div>
            <h3 class="text-xl font-bold font-manrope mb-1">Anjali Mehta</h3>
            <p class="text-brand-red font-bold text-xs uppercase tracking-wider mb-4">Kids Coach</p>
            <p class="text-gray-400 text-sm">Expert in kids gymnastics and youth development programs.</p>
          </div>
          <div class="bg-white/5 p-8 rounded-[2rem] text-center reveal delay-300 group border border-white/10">
            <div class="w-40 h-40 mx-auto rounded-full overflow-hidden mb-6 bg-white/10 flex items-center justify-center">
              <i data-lucide="user-plus" class="w-16 h-16 text-white/30"></i>
            </div>
            <h3 class="text-xl font-bold font-manrope mb-1">Join the Team</h3>
            <p class="text-gray-400 text-sm mt-4">We are always looking for expert trainers.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- VALUES -->
    <section class="py-24 px-6 bg-white">
      <div class="max-w-[1200px] mx-auto">
        <h2 class="text-3xl font-rubik text-center mb-16 reveal">THE FITYARD STANDARD</h2>
        <div class="grid md:grid-cols-3 gap-12 text-center">
          <div class="reveal delay-100">
            <div class="inline-flex p-4 icon-badge mb-6" tabindex="0">
              <i data-lucide="sparkles" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-3">Hygiene First</h3>
            <p class="text-gray-600">Hospital-grade cleanliness standards maintained daily.</p>
          </div>
          <div class="reveal delay-200">
            <div class="inline-flex p-4 icon-badge mb-6" tabindex="0">
              <i data-lucide="shield-check" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-3">Safety</h3>
            <p class="text-gray-600">Proper form guidance and equipment maintenance.</p>
          </div>
          <div class="reveal delay-300">
            <div class="inline-flex p-4 icon-badge mb-6" tabindex="0">
              <i data-lucide="heart" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-3">Community</h3>
            <p class="text-gray-600">A supportive environment where everyone belongs.</p>
          </div>
        </div>
      </div>
    </section>

    ${renderInstagramSection()}

    <!-- CTA -->
    <section class="py-20 bg-brand-red text-center px-6">
      <div class="reveal">
        <h2 class="text-4xl md:text-5xl font-rubik mb-6 text-brand-black">READY TO START?</h2>
        <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-block px-10 py-4 bg-brand-black text-white font-bold rounded-3xl hover:bg-gray-900 transition-colors">
          Book Your First Session
        </a>
      </div>
    </section>
  `;
}

function renderTraining() {
  app.innerHTML = `
    <!-- HERO -->
    <section class="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 img-zoom-container">
        <img src="${getImg('facilities_hero_img', 1600)}" class="w-full h-full object-cover" alt="MMA training session at FitYard Fitness Academy Rohini">
      </div>
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative z-10 text-center px-6 text-white reveal">
        <h1 class="text-5xl md:text-7xl font-rubik mb-4">TRAINING PROGRAMS</h1>
        <p class="text-xl md:text-2xl font-manrope font-light">Movement-based training for kids and adults in Rohini.</p>
      </div>
    </section>

    <!-- PROGRAMS DETAIL -->
    <section class="py-24 px-6 max-w-[1400px] mx-auto space-y-32">
      <!-- Gymnastics -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div class="order-2 md:order-1">
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('feature_strength_img', 800)}" class="w-full h-full object-cover" alt="Kids gymnastics training in Rohini Delhi">
          </div>
        </div>
        <div class="order-1 md:order-2">
          <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">PROGRAM 01</span>
          <h2 class="text-4xl font-rubik mb-6">GYMNASTICS TRAINING</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">Progressive skill-based training that builds flexibility, balance, and body control. Open to kids, teens, and adults at all levels in Rohini.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Kids classes (5–12 years)</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Teen &amp; adult programs</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Progressive skill development</li>
          </ul>
        </div>
      </div>

      <!-- MMA -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div>
          <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">PROGRAM 02</span>
          <h2 class="text-4xl font-rubik mb-6">MMA</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">Mixed martial arts training covering striking, grappling, and ground work. Build toughness, tactical thinking, and real-world fitness.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Striking &amp; grappling fundamentals</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Sparring &amp; fight conditioning</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Mental toughness &amp; discipline</li>
          </ul>
        </div>
        <div>
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('feature_cardio_img', 800)}" class="w-full h-full object-cover" alt="MMA training Rohini Delhi">
          </div>
        </div>
      </div>

      <!-- Kickboxing -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div class="order-2 md:order-1">
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('feature_agility_img', 800)}" class="w-full h-full object-cover" alt="Kickboxing classes in Rohini Delhi">
          </div>
        </div>
        <div class="order-1 md:order-2">
          <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">PROGRAM 03</span>
          <h2 class="text-4xl font-rubik mb-6">KICKBOXING</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">High-energy stand-up striking combining punches, kicks, and footwork. Great for fitness, confidence, and self-defense skills.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Punch, kick &amp; combination drills</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Pad work &amp; bag training</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Self-defense &amp; fitness focus</li>
          </ul>
        </div>
      </div>

      <!-- CrossFit Conditioning -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div>
          <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">PROGRAM 04</span>
          <h2 class="text-4xl font-rubik mb-6">CROSSFIT CONDITIONING</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">High-intensity functional training designed to build total body endurance, power, and athleticism through varied daily workouts.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Daily WOD (workout of the day)</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Olympic lifting &amp; gymnastics elements</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Scalable for all fitness levels</li>
          </ul>
        </div>
        <div>
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('home_hero_img', 800)}" class="w-full h-full object-cover" alt="CrossFit conditioning class at FitYard Rohini">
          </div>
        </div>
      </div>

      <!-- Calisthenics -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div class="order-2 md:order-1">
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('gallery_3_img', 800)}" class="w-full h-full object-cover" alt="Combat training at FitYard Fitness Academy Rohini Delhi">
          </div>
        </div>
        <div class="order-1 md:order-2">
          <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">PROGRAM 05</span>
          <h2 class="text-4xl font-rubik mb-6">CALISTHENICS</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">Master your own bodyweight. From push-ups to muscle-ups, build functional strength, coordination, and body awareness with no machines needed.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Beginner to advanced progressions</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Bar skills: muscle-up, front lever</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Handstand &amp; balance training</li>
          </ul>
        </div>
      </div>

      <!-- Strength Training -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div>
          <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-4">PROGRAM 06</span>
          <h2 class="text-4xl font-rubik mb-6">STRENGTH TRAINING</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">Structured resistance and compound lifting to build lean muscle, improve posture, and boost athletic performance — no machine-gym approach.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Barbell &amp; compound lifts</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Progressive overload programming</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Sport-specific strength focus</li>
          </ul>
        </div>
        <div>
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('gallery_1_img', 800)}" class="w-full h-full object-cover" alt="Kids athletic training at FitYard Fitness Academy Rohini Delhi">
          </div>
        </div>
      </div>

      <!-- Kids Athletic Development -->
      <div class="grid md:grid-cols-2 gap-16 items-center reveal">
        <div class="order-2 md:order-1">
          <div class="rounded-[2.5rem] overflow-hidden h-[400px] img-zoom-container">
            <img src="${getImg('home_coach_img', 800)}" class="w-full h-full object-cover" alt="Kids athletic development program in Rohini Delhi">
          </div>
        </div>
        <div class="order-1 md:order-2">
          <span class="inline-block px-3 py-1 bg-brand-red text-white text-xs font-bold rounded-full mb-4">KIDS SPECIAL</span>
          <h2 class="text-4xl font-rubik mb-6">KIDS ATHLETIC DEVELOPMENT</h2>
          <p class="text-gray-600 text-lg leading-relaxed mb-6">A dedicated program for children aged 5–14 in Rohini. Sport-based play, agility drills, and movement foundations that build confidence, discipline, and a love for fitness.</p>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Ages 5–14 / multi-sport approach</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Coordination, agility &amp; speed</li>
            <li class="flex items-center gap-3"><i data-lucide="check" class="w-5 h-5 text-brand-green"></i> Confidence &amp; discipline development</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- AMENITIES -->
    <section class="py-24 bg-brand-gray px-6">
      <div class="max-w-[1200px] mx-auto">
        <h2 class="text-3xl font-rubik text-center mb-16 reveal">AMENITIES</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="flex flex-col items-center text-center reveal delay-100">
            <div class="w-16 h-16 icon-badge mb-4" tabindex="0">
              <i data-lucide="wind" class="w-8 h-8"></i>
            </div>
            <span class="font-bold font-manrope">AC Climate Control</span>
          </div>
          <div class="flex flex-col items-center text-center reveal delay-200">
            <div class="w-16 h-16 icon-badge mb-4" tabindex="0">
              <i data-lucide="lock" class="w-8 h-8"></i>
            </div>
            <span class="font-bold font-manrope">Secure Lockers</span>
          </div>
          <div class="flex flex-col items-center text-center reveal delay-300">
            <div class="w-16 h-16 icon-badge mb-4" tabindex="0">
              <i data-lucide="droplets" class="w-8 h-8"></i>
            </div>
            <span class="font-bold font-manrope">RO Water</span>
          </div>
          <div class="flex flex-col items-center text-center reveal delay-400">
            <div class="w-16 h-16 icon-badge mb-4" tabindex="0">
              <i data-lucide="car" class="w-8 h-8"></i>
            </div>
            <span class="font-bold font-manrope">Parking</span>
          </div>
        </div>
      </div>
    </section>

    ${renderInstagramSection()}

    <!-- CTA -->
    <section class="py-20 bg-brand-black text-white text-center px-6">
      <div class="reveal">
        <h2 class="text-4xl md:text-5xl font-rubik mb-8">EXPERIENCE IT YOURSELF.</h2>
        <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-block px-10 py-4 bg-brand-red text-white font-bold rounded-3xl hover:bg-red-400 transition-colors">
          Book Your First Session
        </a>
      </div>
    </section>
  `;
}

function renderGallery() {
  app.innerHTML = `
    <!-- HERO -->
    <section class="relative h-[50vh] min-h-[350px] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 img-zoom-container">
        <img src="${getImg('gallery_1_img', 1600)}" class="w-full h-full object-cover" alt="Kids athletic training at FitYard Fitness Academy Rohini Delhi">
      </div>
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 text-center px-6 text-white reveal">
        <h1 class="text-5xl md:text-7xl font-rubik mb-4">GALLERY</h1>
        <p class="text-xl font-manrope font-light">Inside FitYard Fitness Academy</p>
      </div>
    </section>

    <!-- GALLERY GRID -->
    <section class="py-24 bg-brand-black">
      <div class="max-w-[1400px] mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div class="aspect-square rounded-2xl overflow-hidden img-zoom-container reveal delay-100">
            <img src="${getImg('gallery_1_img', 600)}" class="w-full h-full object-cover" alt="Kids athletic training moment at FitYard Fitness Academy Rohini Delhi">
          </div>
          <div class="aspect-square rounded-2xl overflow-hidden img-zoom-container reveal delay-150">
            <img src="${getImg('gallery_2_img', 600)}" class="w-full h-full object-cover" alt="Sport fitness training session at FitYard Fitness Academy Rohini Delhi">
          </div>
          <div class="aspect-square rounded-2xl overflow-hidden img-zoom-container reveal delay-200">
            <img src="${getImg('gallery_3_img', 600)}" class="w-full h-full object-cover" alt="Combat training at FitYard Fitness Academy Rohini Delhi">
          </div>
          <div class="aspect-square rounded-2xl overflow-hidden img-zoom-container reveal delay-250">
            <img src="${getImg('gallery_4_img', 600)}" class="w-full h-full object-cover" alt="Group training session at FitYard Fitness Academy Rohini Delhi">
          </div>
          <div class="aspect-square rounded-2xl overflow-hidden img-zoom-container reveal delay-300">
            <img src="${getImg('gallery_5_img', 600)}" class="w-full h-full object-cover" alt="Movement training moment at FitYard Fitness Academy Rohini Delhi">
          </div>
          <div class="aspect-square rounded-2xl overflow-hidden img-zoom-container reveal delay-350">
            <img src="${getImg('gallery_6_img', 600)}" class="w-full h-full object-cover" alt="Boxing coaching at FitYard Fitness Academy Rohini Delhi">
          </div>
        </div>
      </div>
    </section>

    ${renderInstagramSection()}

    <!-- CTA -->
    <section class="py-20 bg-brand-black text-white text-center px-6">
      <div class="reveal">
        <h2 class="text-4xl font-rubik mb-8">SEE IT IN PERSON.</h2>
        <a href="/contact" onclick="handleNav(event, '/contact')" class="inline-block px-10 py-4 bg-brand-red text-white font-bold rounded-3xl hover:bg-red-400 transition-colors">
          Book Your First Session
        </a>
      </div>
    </section>
  `;
}

function renderContact() {
  app.innerHTML = `
    <!-- Main Contact Section -->
    <section class="py-24 lg:py-32 bg-white">
      <div class="max-w-[1400px] mx-auto px-6">

        <!-- Two-Column Booking Container -->
        <div class="bg-brand-black rounded-[2rem] overflow-hidden reveal">
          <div class="grid lg:grid-cols-2">

            <!-- LEFT: Image Panel -->
            <div class="relative h-[350px] lg:h-auto lg:min-h-[700px] order-1 lg:order-1 rounded-l-[2rem] overflow-hidden contact-image-panel">
              <img src="https://static.kite.ai/image/upload/v1772803118/app/0a268b1a-133a-43c1-a8bd-63f260f63982/kccppctaqyy0ohztuipu.jpg" alt="movement training session at FitYard Fitness Academy Rohini Delhi" class="absolute inset-0 w-full h-full object-cover object-center">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

              <!-- Contact Cards at bottom of image -->
              <div class="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-3">
                <a href="tel:+919990655542" class="flex items-center gap-3 bg-brand-red hover:bg-red-600 text-white px-5 py-3 rounded-xl transition-colors flex-1 justify-center sm:justify-start">
                  <i data-lucide="phone" class="w-5 h-5"></i>
                  <span class="font-semibold">+91 9990655542</span>
                </a>
                <a href="https://wa.me/919990655542?text=Hi%20FitYard!%20I'm%20interested%20in%20booking%20a%20trial%20session." target="_blank" class="flex items-center gap-3 bg-brand-red hover:bg-red-600 text-white px-5 py-3 rounded-xl transition-colors flex-1 justify-center sm:justify-start">
                  <i data-lucide="message-circle" class="w-5 h-5"></i>
                  <span class="font-semibold">WhatsApp Us</span>
                </a>
              </div>
            </div>

            <!-- RIGHT: Form Panel -->
            <div class="p-8 lg:p-12 text-white order-2 lg:order-2">
              <span class="inline-block px-3 py-1 bg-brand-red/20 text-brand-red text-xs font-bold rounded-full mb-4 uppercase tracking-wide">Get in Touch</span>
              <h1 class="text-4xl md:text-5xl font-rubik mb-3">START YOUR MOVEMENT JOURNEY</h1>
              <p class="text-gray-400 mb-8">Book a trial session at FitYard Fitness Academy, Rohini.</p>

              <form id="contact-booking-form" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Name</label>
                    <input type="text" name="name" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:border-brand-red focus:outline-none transition-colors" placeholder="Your name">
                  </div>
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Phone</label>
                    <input type="tel" name="phone" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:border-brand-red focus:outline-none transition-colors" placeholder="+91">
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Age Group</label>
                    <select name="age" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white focus:border-brand-red focus:outline-none transition-colors appearance-none">
                      <option value="" class="bg-brand-black">Select age group</option>
                      <option value="Kids 5-8" class="bg-brand-black">Kids (5-8 years)</option>
                      <option value="Kids 9-12" class="bg-brand-black">Kids (9-12 years)</option>
                      <option value="Teens 13-17" class="bg-brand-black">Teens (13-17 years)</option>
                      <option value="Adults 18+" class="bg-brand-black">Adults (18+ years)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-bold mb-2 text-gray-300">Program Interest</label>
                    <select name="goal" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white focus:border-brand-red focus:outline-none transition-colors appearance-none">
                      <option value="" class="bg-brand-black">Select program</option>
                      <option value="Gymnastics" class="bg-brand-black">Gymnastics Training</option>
                      <option value="MMA" class="bg-brand-black">MMA Training</option>
                      <option value="Kickboxing" class="bg-brand-black">Kickboxing Classes</option>
                      <option value="CrossFit" class="bg-brand-black">CrossFit Conditioning</option>
                      <option value="Strength" class="bg-brand-black">Strength Training</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-bold mb-2 text-gray-300">Preferred Time</label>
                  <select name="time" required class="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/10 text-white focus:border-brand-red focus:outline-none transition-colors appearance-none">
                    <option value="" class="bg-brand-black">Select time</option>
                    <option value="6AM-9AM" class="bg-brand-black">Morning (6AM-9AM)</option>
                    <option value="9AM-12PM" class="bg-brand-black">Late Morning (9AM-12PM)</option>
                    <option value="12PM-4PM" class="bg-brand-black">Afternoon (12PM-4PM)</option>
                    <option value="4PM-7PM" class="bg-brand-black">Evening (4PM-7PM)</option>
                    <option value="7PM-10PM" class="bg-brand-black">Night (7PM-10PM)</option>
                  </select>
                </div>
                <button type="submit" class="w-full py-4 bg-brand-red text-white font-bold text-lg rounded-3xl hover:bg-red-600 transition-colors mt-2">
                  Book Trial Session
                </button>
              </form>

              <!-- Success State -->
              <div id="contact-booking-success" class="hidden mt-6 p-6 bg-brand-green/20 border border-brand-green/30 rounded-xl">
                <div class="flex items-center gap-3 mb-4">
                  <i data-lucide="check-circle" class="w-6 h-6 text-brand-green"></i>
                  <span class="font-bold text-brand-green">Booking Request Sent!</span>
                </div>
                <p class="text-gray-300 text-sm mb-4">We will contact you shortly to confirm your trial session.</p>
                <a id="contact-whatsapp-link" href="#" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                  Continue on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Location Info Below -->
        <div class="mt-16 reveal delay-200">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl md:text-4xl font-rubik mb-6">FIND US</h2>
              <div class="space-y-4 text-gray-600">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i data-lucide="map-pin" class="w-5 h-5 text-brand-red"></i>
                  </div>
                  <div>
                    <p class="font-bold text-brand-black">FitYard Fitness Academy</p>
                    <p>${data.company.address}</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i data-lucide="clock" class="w-5 h-5 text-brand-red"></i>
                  </div>
                  <div>
                    <p class="font-bold text-brand-black">Hours</p>
                    <p>Mon-Sat: 6AM - 10PM | Sun: 8AM - 2PM</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-[1.5rem] overflow-hidden h-[300px] lg:h-[350px] shadow-xl">
              <iframe src="${data.company.mapUrl}" class="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500" allowfullscreen="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${renderInstagramSection()}
  `;
  attachContactBookingForm();
}

// ─── BOOKING FORM HANDLING ────────────────────────────────────
function attachBookingForm() {
  const form = document.getElementById('booking-form');
  const successDiv = document.getElementById('booking-success');
  const whatsappLink = document.getElementById('whatsapp-link');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const age = formData.get('age');
    const goal = formData.get('goal');
    const time = formData.get('time');

    // Show success
    form.classList.add('hidden');
    successDiv.classList.remove('hidden');
    lucide.createIcons();

    // WhatsApp link
    const message = encodeURIComponent(`Hi FitYard Fitness Academy! I would like to book my first session.\n\nName: ${name}\nPhone: ${phone}\nAge: ${age}\nProgram: ${goal}\nPreferred Time: ${time}`);
    whatsappLink.href = `https://wa.me/919990655542?text=${message}`;
  });
}

function attachContactBookingForm() {
  const form = document.getElementById('contact-booking-form');
  const successDiv = document.getElementById('contact-booking-success');
  const whatsappLink = document.getElementById('contact-whatsapp-link');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const age = formData.get('age');
    const goal = formData.get('goal');
    const time = formData.get('time');

    // Show success
    form.classList.add('hidden');
    successDiv.classList.remove('hidden');
    lucide.createIcons();

    // WhatsApp link
    const message = encodeURIComponent(`Hi FitYard Fitness Academy! I would like to book my first session.\n\nName: ${name}\nPhone: ${phone}\nAge: ${age}\nProgram: ${goal}\nPreferred Time: ${time}`);
    whatsappLink.href = `https://wa.me/919990655542?text=${message}`;
  });
}

// ─── GLOBAL INIT ──────────────────────────────────────────────
// Mobile Menu
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('translate-x-full');
});
closeMobileMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.add('translate-x-full');
});

// Browser Navigation
addEventListener('popstate', () => render(location.pathname));
window.handleNav = handleNav;

// ─── PARALLAX ─────────────────────────────────────────────────
function initParallax() {
  const imgs = document.querySelectorAll('[data-parallax]');
  if (!imgs.length) return;
  function onScroll() {
    const scrollY = window.scrollY;
    imgs.forEach(img => {
      const speed = parseFloat(img.getAttribute('data-parallax')) || 0.05;
      img.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─── MEMBERSHIP STICKY OBSERVER ──────────────────────────────
function initMembershipObserver() {
  const panels = document.querySelectorAll('.membership-panel');
  const stepNum = document.getElementById('membership-step-num');
  const stepLabel = document.getElementById('membership-step-label');

  if (!panels.length || !stepNum) return;

  let currentStep = 1;
  let isAnimating = false;
  const panelRatios = new Map();

  // Initialize all panels with 0 ratio
  panels.forEach(panel => {
    panelRatios.set(panel, 0);
  });

  function updateStep(newStep) {
    if (newStep === currentStep || isAnimating) return;

    isAnimating = true;
    currentStep = newStep;

    // Animate step number and label
    stepNum.style.opacity = '0';
    stepNum.style.transform = 'translateY(-8px)';
    if (stepLabel) {
      stepLabel.style.opacity = '0';
      stepLabel.style.transform = 'translateY(-4px)';
    }

    setTimeout(() => {
      stepNum.textContent = newStep.toString().padStart(2, '0');
      if (stepLabel) {
        stepLabel.textContent = 'Step ' + newStep;
      }

      stepNum.style.opacity = '1';
      stepNum.style.transform = 'translateY(0)';
      if (stepLabel) {
        stepLabel.style.opacity = '1';
        stepLabel.style.transform = 'translateY(0)';
      }

      setTimeout(() => {
        isAnimating = false;
      }, 150);
    }, 150);
  }

  function findActivePanel() {
    let maxRatio = 0;
    let activeStep = currentStep;

    panelRatios.forEach((ratio, panel) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        activeStep = parseInt(panel.getAttribute('data-step'));
      }
    });

    // Only update if we have meaningful intersection
    if (maxRatio > 0.15) {
      updateStep(activeStep);
    }
  }

  // Debounced update
  let debounceTimer = null;
  function debouncedUpdate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(findActivePanel, 50);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      panelRatios.set(entry.target, entry.intersectionRatio);
    });
    debouncedUpdate();
  }, {
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    rootMargin: '-100px 0px -35% 0px'
  });

  panels.forEach(panel => observer.observe(panel));
}

// Initial Render
initLogo();
setCopyright();
initStickyHeader();
render(location.pathname);
initParallax();

// ========================================
// GALACTIC TYCOONS - Sidebar Navigation Toggle
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('gtSidebarNav');
    const toggleBtn = document.getElementById('sidebarToggle');
    const pageContent = document.querySelector('.gt-page-content');

    if (!sidebar || !toggleBtn) {
        console.log('Sidebar navigation not found on this page');
        return;
    }

    // Check localStorage for saved state
    const savedState = localStorage.getItem('gt_sidebar_collapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        if (pageContent) {
            pageContent.style.marginLeft = '70px';
        }
    }

    // Toggle sidebar on button click
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');

        const isCollapsed = sidebar.classList.contains('collapsed');

        // Update page content margin
        if (pageContent) {
            pageContent.style.marginLeft = isCollapsed ? '70px' : '260px';
        }

        // Save state to localStorage
        localStorage.setItem('gt_sidebar_collapsed', isCollapsed);

        console.log('Sidebar toggled:', isCollapsed ? 'collapsed' : 'expanded');
    });

    // Mobile: Open sidebar on toggle button click
    if (window.innerWidth <= 768) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }

    console.log('Sidebar navigation initialized');
});

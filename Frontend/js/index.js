document.addEventListener("DOMContentLoaded", () => {
    // Theme toggle
    const themeToggle = document.getElementById("themeToggle");
    const drawerThemeToggle = document.getElementById("drawerThemeToggle");
    
    if (localStorage.getItem('metras_theme') === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
        if(drawerThemeToggle) drawerThemeToggle.textContent = '☀️ Light Mode';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggle.textContent = isLight ? '☀️' : '🌙';
        if(drawerThemeToggle) drawerThemeToggle.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('metras_theme', isLight ? 'light' : 'dark');
    });
    
    if(drawerThemeToggle) {
        drawerThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            themeToggle.textContent = isLight ? '☀️' : '🌙';
            drawerThemeToggle.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
            localStorage.setItem('metras_theme', isLight ? 'light' : 'dark');
        });
    }
    
    // Hamburger menu
    const btnMenu = document.getElementById("btnMenu");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const drawer = document.getElementById("drawer");
    const backdrop = document.getElementById("backdrop");
    
    btnMenu?.addEventListener("click", () => {
        drawer.classList.add("open");
        backdrop.hidden = false;
    });
    
    btnCloseDrawer?.addEventListener("click", () => {
        drawer.classList.remove("open");
        backdrop.hidden = true;
    });
    
    backdrop?.addEventListener("click", () => {
        drawer.classList.remove("open");
        backdrop.hidden = true;
    });
});
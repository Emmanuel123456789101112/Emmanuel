/**
 * App - Gestor Personal (Cursos, Libros, Proyectos)
 * Aplicación con autenticación que gestiona tres módulos.
 * Usa localStorage para guardar datos (sin Firebase).
 */

const App = {
    currentUser: null,
    currentModule: 'courses',
    ratings: {
        course: 0,
        book: 0,
        project: 0
    },
    localData: {
        courses: [],
        books: [],
        projects: []
    },

    async init() {
        this.loadLocalData();
        this.bindEvents();
        await this.checkSession();
    },

    async checkSession() {
        const user = localStorage.getItem('currentUser');
        const token = localStorage.getItem('authToken');
        
        if (user && token) {
            try {
                const decoded = atob(token);
                const [storedUser, storedPass] = decoded.split(':');
                if (storedUser === 'Emmanuel' && storedPass === 'emmanuel@19') {
                    this.currentUser = user;
                    this.showMainView();
                    return;
                }
            } catch (e) {}
        }
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.showLoginView();
    },

    loadLocalData() {
        const stored = localStorage.getItem('gestorData');
        if (stored) {
            this.localData = JSON.parse(stored);
        }
    },

    saveLocalData() {
        localStorage.setItem('gestorData', JSON.stringify(this.localData));
    },

    showLoginView() {
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('main-view').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    },

    showMainView() {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
        document.getElementById('user-greeting').textContent = 'Hola, ' + this.currentUser;
        this.loadModule(this.currentModule);
    },

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchModule(tab.dataset.module);
            });
        });

        document.getElementById('course-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCourse();
        });

        document.getElementById('book-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBook();
        });

        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProject();
        });

        this.bindStarRatings();
    },

    bindStarRatings() {
        ['course', 'book', 'project'].forEach(type => {
            const container = document.querySelector('#' + type + '-rating .stars-input');
            if (!container) return;
            
            container.querySelectorAll('span').forEach(star => {
                star.addEventListener('click', () => {
                    this.ratings[type] = parseInt(star.dataset.value);
                    this.updateStarsDisplay(type);
                });
                star.addEventListener('mouseenter', () => {
                    const value = parseInt(star.dataset.value);
                    this.highlightStars(container, value);
                });
            });
            container.addEventListener('mouseleave', () => {
                this.updateStarsDisplay(type);
            });
        });
    },

    highlightStars(container, value) {
        container.querySelectorAll('span').forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('active', starValue <= value);
        });
    },

    updateStarsDisplay(type) {
        const container = document.querySelector('#' + type + '-rating .stars-input');
        if (!container) return;
        
        const rating = this.ratings[type];
        container.dataset.rating = rating;
        container.querySelectorAll('span').forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('active', starValue <= rating);
        });
    },

    async login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            document.getElementById('login-error').textContent = 'Ingresa usuario y contrasena';
            return;
        }
        
        if (username !== 'Emmanuel' || password !== 'emmanuel@19') {
            document.getElementById('login-error').textContent = 'Credenciales incorrectas';
            return;
        }
        
        this.currentUser = username;
        localStorage.setItem('currentUser', username);
        localStorage.setItem('authToken', btoa(username + ':' + password));
        this.loadLocalData();
        this.showMainView();
    },

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.localData = { courses: [], books: [], projects: [] };
        this.showLoginView();
    },

    switchModule(module) {
        this.currentModule = module;
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.module === module);
        });
        document.querySelectorAll('.module').forEach(mod => {
            mod.classList.add('hidden');
            mod.classList.remove('active');
        });
        const targetModule = document.getElementById(module + '-module');
        targetModule.classList.remove('hidden');
        targetModule.classList.add('active');
        this.loadModule(module);
    },

    loadModule(module) {
        switch (module) {
            case 'courses':
                this.renderCourses();
                break;
            case 'books':
                this.renderBooks();
                break;
            case 'projects':
                this.renderProjects();
                break;
        }
    },

    getData(type) {
        return this.localData[type] || [];
    },

    async addCourse() {
        const name = document.getElementById('course-name').value.trim();
        const author = document.getElementById('course-author').value.trim();
        const url = document.getElementById('course-url').value.trim();
        const rating = this.ratings.course;

        if (!name || !author) return;

        const course = {
            id: Date.now().toString(),
            name,
            author,
            url,
            rating,
            createdAt: new Date().toISOString()
        };

        this.localData.courses.push(course);
        this.saveLocalData();
        
        this.resetForm('course');
        this.renderCourses();
    },

    renderCourses() {
        const courses = this.getData('courses');
        const list = document.getElementById('course-list');

        if (courses.length === 0) {
            list.innerHTML = this.getEmptyStateHTML('No hay cursos');
            return;
        }

        list.innerHTML = courses.map(course => {
            return '<div class="card-item">' +
                '<div class="card-header">' +
                    '<span class="card-title">' + this.escapeHtml(course.name) + '</span>' +
                    '<div class="card-stars">' + this.renderStars(course.rating) + '</div>' +
                '</div>' +
                '<div class="card-info">' +
                    '<span>' + this.escapeHtml(course.author) + '</span>' +
                '</div>' +
                (course.url ? '<a href="' + this.escapeHtml(course.url) + '" target="_blank" class="card-link">Ver curso</a>' : '') +
                '<div class="card-actions">' +
                    '<button class="btn btn-danger" onclick="App.deleteItem(\'courses\', \'' + course.id + '\')">Eliminar</button>' +
                '</div>' +
            '</div>';
        }).join('');
    },

    async addBook() {
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const url = document.getElementById('book-url').value.trim();
        const rating = this.ratings.book;

        if (!title || !author) return;

        const book = {
            id: Date.now().toString(),
            title,
            author,
            url,
            rating,
            createdAt: new Date().toISOString()
        };

        this.localData.books.push(book);
        this.saveLocalData();
        
        this.resetForm('book');
        this.renderBooks();
    },

    renderBooks() {
        const books = this.getData('books');
        const list = document.getElementById('book-list');

        if (books.length === 0) {
            list.innerHTML = this.getEmptyStateHTML('No hay libros');
            return;
        }

        list.innerHTML = books.map(book => {
            return '<div class="card-item">' +
                '<div class="card-header">' +
                    '<span class="card-title">' + this.escapeHtml(book.title) + '</span>' +
                    '<div class="card-stars">' + this.renderStars(book.rating) + '</div>' +
                '</div>' +
                '<div class="card-info">' +
                    '<span>' + this.escapeHtml(book.author) + '</span>' +
                '</div>' +
                (book.url ? '<a href="' + this.escapeHtml(book.url) + '" target="_blank" class="card-link">Ver libro</a>' : '') +
                '<div class="card-actions">' +
                    '<button class="btn btn-danger" onclick="App.deleteItem(\'books\', \'' + book.id + '\')">Eliminar</button>' +
                '</div>' +
            '</div>';
        }).join('');
    },

    async addProject() {
        const name = document.getElementById('project-name').value.trim();
        const desc = document.getElementById('project-desc').value.trim();
        const url = document.getElementById('project-url').value.trim();
        const rating = this.ratings.project;

        if (!name) return;

        const project = {
            id: Date.now().toString(),
            name,
            desc,
            url,
            rating,
            createdAt: new Date().toISOString()
        };

        this.localData.projects.push(project);
        this.saveLocalData();
        
        this.resetForm('project');
        this.renderProjects();
    },

    renderProjects() {
        const projects = this.getData('projects');
        const list = document.getElementById('project-list');

        if (projects.length === 0) {
            list.innerHTML = this.getEmptyStateHTML('No hay proyectos');
            return;
        }

        list.innerHTML = projects.map(project => {
            return '<div class="card-item">' +
                '<div class="card-header">' +
                    '<span class="card-title">' + this.escapeHtml(project.name) + '</span>' +
                    '<div class="card-stars">' + this.renderStars(project.rating) + '</div>' +
                '</div>' +
                (project.desc ? '<div class="card-info"><span>' + this.escapeHtml(project.desc) + '</span></div>' : '') +
                (project.url ? '<a href="' + this.escapeHtml(project.url) + '" target="_blank" class="card-link">Ver proyecto</a>' : '') +
                '<div class="card-actions">' +
                    '<button class="btn btn-danger" onclick="App.deleteItem(\'projects\', \'' + project.id + '\')">Eliminar</button>' +
                '</div>' +
            '</div>';
        }).join('');
    },

    renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += '<span class="' + (i <= rating ? '' : 'empty') + '">★</span>';
        }
        return html;
    },

    async deleteItem(type, id) {
        this.localData[type] = this.localData[type].filter(item => item.id !== id);
        this.saveLocalData();
        this.loadModule(type);
    },

    resetForm(type) {
        if (type === 'course') {
            document.getElementById('course-name').value = '';
            document.getElementById('course-author').value = '';
            document.getElementById('course-url').value = '';
        } else if (type === 'book') {
            document.getElementById('book-title').value = '';
            document.getElementById('book-author').value = '';
            document.getElementById('book-url').value = '';
        } else if (type === 'project') {
            document.getElementById('project-name').value = '';
            document.getElementById('project-desc').value = '';
            document.getElementById('project-url').value = '';
        }
        this.ratings[type] = 0;
        this.updateStarsDisplay(type);
    },

    getEmptyStateHTML(message) {
        return '<div class="empty-state">' +
            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<circle cx="12" cy="12" r="10"></circle>' +
                '<path d="M8 12h8"></path>' +
            '</svg>' +
            '<p>' + message + '</p>' +
            '<span>Agrega nuevo contenido usando el formulario de arriba</span>' +
        '</div>';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

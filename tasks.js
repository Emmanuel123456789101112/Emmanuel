/**
 * Módulo de Tareas (Tasks)
 * Gestiona una lista de tareas simple sin necesidad de login.
 * Los datos se almacenan en localStorage del navegador.
 */

const Tasks = {
    /** Filtro actual: 'all', 'pending' o 'completed' */
    filter: 'all',
    
    /** Array de tareas */
    tasks: [],

    /**
     * Inicializa el módulo.
     * Carga las tareas guardadas, vincula eventos y renderiza la vista.
     */
    async init() {
        this.loadTasks();
        this.bindEvents();
        this.render();
    },

    /**
     * Vincula los eventos del DOM:
     * - Envío del formulario de nueva tarea
     * - Clic en botones de filtro
     */
    bindEvents() {
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });
    },

    /**
     * Carga las tareas desde localStorage.
     * Convierte el JSON almacenado al array de tareas.
     */
    loadTasks() {
        const stored = localStorage.getItem('tasks');
        if (stored) {
            this.tasks = JSON.parse(stored);
        }
    },

    /**
     * Guarda las tareas en localStorage.
     * Convierte el array a JSON para el almacenamiento.
     */
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    },

    /**
     * Cambia el filtro de visualización.
     * @param {string} filter - 'all', 'pending' o 'completed'
     */
    setFilter(filter) {
        this.filter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    },

    /**
     * Agrega una nueva tarea desde el input del formulario.
     * Crea un objeto tarea con id único, texto, estado y fecha.
     */
    addTask() {
        const input = document.getElementById('task-input');
        const text = input.value.trim();
        if (!text) return;

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        input.value = '';
        this.render();
    },

    /**
     * Alterna el estado de completitud de una tarea.
     * @param {string} id - ID de la tarea
     */
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    },

    /**
     * Elimina una tarea por su ID.
     * @param {string} id - ID de la tarea
     */
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    },

    /**
     * Renderiza la lista de tareas según el filtro actual.
     * Muestra estado vacío si no hay tareas.
     */
    render() {
        const list = document.getElementById('task-list');
        
        let filtered = this.tasks;
        if (this.filter === 'pending') {
            filtered = this.tasks.filter(t => !t.completed);
        } else if (this.filter === 'completed') {
            filtered = this.tasks.filter(t => t.completed);
        }

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 12h8"></path>
                    </svg>
                    <p>No hay tareas</p>
                    <span>Agrega nuevo contenido usando el formulario de arriba</span>
                </div>
            `;
            return;
        }

        list.innerHTML = filtered.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="Tasks.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="btn btn-danger" onclick="Tasks.deleteTask('${task.id}')">Eliminar</button>
            </div>
        `).join('');
    },

    /**
     * Escapa caracteres HTML para prevenir XSS.
     * @param {string} text - Texto a escapar
     * @returns {string} Texto seguro
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => Tasks.init());
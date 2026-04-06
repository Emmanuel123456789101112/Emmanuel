/**
 * drive.js - Sistema de archivos tipo Google Drive
 * 
 * Gestiona archivos y carpetas en localStorage.
 */

const Drive = {
    currentPath: [],
    files: [],
    selectedFile: null,

    init() {
        this.loadFiles();
        this.render();
        this.bindEvents();
    },

    loadFiles() {
        const stored = localStorage.getItem('driveFiles');
        this.files = stored ? JSON.parse(stored) : [];
    },

    saveFiles() {
        localStorage.setItem('driveFiles', JSON.stringify(this.files));
    },

    bindEvents() {
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        document.addEventListener('click', () => {
            document.getElementById('context-menu').classList.remove('show');
        });
    },

    getCurrentFolder() {
        let current = this.files;
        for (const folderName of this.currentPath) {
            const folder = current.find(f => f.name === folderName && f.type === 'folder');
            if (folder && folder.children) {
                current = folder.children;
            }
        }
        return current;
    },

    render() {
        this.renderBreadcrumb();
        this.renderFiles();
    },

    renderBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        let html = '<span onclick="Drive.navigateTo(0)">Drive</span>';
        
        this.currentPath.forEach((folder, index) => {
            html += ' / <span onclick="Drive.navigateTo(' + (index + 1) + ')">' + this.escapeHtml(folder) + '</span>';
        });
        
        breadcrumb.innerHTML = html;
    },

    renderFiles() {
        const grid = document.getElementById('file-grid');
        const currentFolder = this.getCurrentFolder();

        if (currentFolder.length === 0) {
            grid.innerHTML = '<div class="empty-drive">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                    '<path d="M22 19a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                '</svg>' +
                '<p>No hay archivos</p>' +
                '<span>Crea una carpeta o sube un archivo</span>' +
            '</div>';
            return;
        }

        grid.innerHTML = currentFolder.map(file => {
            const isFolder = file.type === 'folder';
            return '<div class="file-item ' + (isFolder ? 'folder' : '') + '" ' +
                'onclick="Drive.handleClick(\'' + this.escapeHtml(file.name) + '\', \'' + file.type + '\')" ' +
                'oncontextmenu="Drive.showContextMenu(event, \'' + this.escapeHtml(file.name) + '\', \'' + file.type + '\')">' +
                '<div class="file-icon ' + (isFolder ? 'folder' : '') + '">' +
                    (isFolder ?
                        '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' :
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
                    ) +
                '</div>' +
                '<div class="file-name">' + this.escapeHtml(file.name) + '</div>' +
                '<div class="file-meta">' + (isFolder ? 'Carpeta' : this.formatSize(file.size)) + '</div>' +
            '</div>';
        }).join('');
    },

    handleClick(name, type) {
        if (type === 'folder') {
            this.currentPath.push(name);
            this.render();
        }
    },

    navigateTo(index) {
        this.currentPath = this.currentPath.slice(0, index);
        this.render();
    },

    showContextMenu(event, name, type) {
        event.preventDefault();
        event.stopPropagation();
        
        this.selectedFile = { name, type };
        
        const menu = document.getElementById('context-menu');
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        menu.classList.add('show');
    },

    openFile() {
        const file = this.findFile(this.selectedFile.name);
        if (file && file.type !== 'folder') {
            if (file.content) {
                const blob = this.base64ToBlob(file.content, file.mimeType);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } else if (file && file.type === 'folder') {
            this.currentPath.push(file.name);
            this.render();
        }
        this.hideContextMenu();
    },

    renameFile() {
        document.getElementById('rename-input').value = this.selectedFile.name;
        document.getElementById('rename-modal').classList.add('show');
        this.hideContextMenu();
    },

    saveRename() {
        const newName = document.getElementById('rename-input').value.trim();
        if (!newName || !this.selectedFile) return;

        const currentFolder = this.getCurrentFolder();
        const fileIndex = currentFolder.findIndex(f => f.name === this.selectedFile.name);
        
        if (fileIndex !== -1) {
            currentFolder[fileIndex].name = newName;
            this.saveFiles();
            this.render();
        }
        
        this.hideModal();
    },

    deleteFile() {
        if (!this.selectedFile) return;
        
        const currentFolder = this.getCurrentFolder();
        const index = currentFolder.findIndex(f => f.name === this.selectedFile.name);
        
        if (index !== -1) {
            currentFolder.splice(index, 1);
            this.saveFiles();
            this.render();
        }
        
        this.hideContextMenu();
    },

    showNewFolderModal() {
        document.getElementById('folder-name-input').value = '';
        document.getElementById('folder-modal').classList.add('show');
    },

    hideModal() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    },

    hideContextMenu() {
        document.getElementById('context-menu').classList.remove('show');
    },

    createFolder() {
        const name = document.getElementById('folder-name-input').value.trim();
        if (!name) return;

        const currentFolder = this.getCurrentFolder();
        
        if (currentFolder.some(f => f.name === name)) {
            alert('Ya existe una carpeta con ese nombre');
            return;
        }

        currentFolder.push({
            name: name,
            type: 'folder',
            children: [],
            createdAt: new Date().toISOString()
        });

        this.saveFiles();
        this.render();
        this.hideModal();
    },

    uploadFile() {
        document.getElementById('file-input').click();
    },

    handleFileUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const currentFolder = this.getCurrentFolder();
            
            currentFolder.push({
                name: file.name,
                type: 'file',
                size: file.size,
                mimeType: file.type,
                content: e.target.result,
                createdAt: new Date().toISOString()
            });

            this.saveFiles();
            this.render();
        };
        reader.readAsDataURL(file);
        
        document.getElementById('file-input').value = '';
    },

    findFile(name) {
        let current = this.files;
        for (const folderName of this.currentPath) {
            const folder = current.find(f => f.name === folderName && f.type === 'folder');
            if (folder && folder.children) {
                current = folder.children;
            }
        }
        return current.find(f => f.name === name);
    },

    formatSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => Drive.init());

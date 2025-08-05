document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeSwitch = document.getElementById('theme-switch');
    const taskForm = document.getElementById('task-form');
    const taskModal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const closeModalBtn = document.querySelector('.close-modal');
    const tasksList = document.getElementById('tasks-list');
    const categoriesList = document.getElementById('categories-list');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category');
    const taskSearch = document.getElementById('task-search');
    const filterCategory = document.getElementById('filter-category');
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const allTasksBtn = document.getElementById('all-tasks');
    const todayTasksBtn = document.getElementById('today-tasks');
    const importantTasksBtn = document.getElementById('important-tasks');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const taskCategorySelect = document.getElementById('task-category');
    const filterCategorySelect = document.getElementById('filter-category');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || ['Work', 'Personal', 'Shopping'];
    let currentFilter = 'all';
    let editingTaskId = null;

    // Initialize the app
    init();

    function init() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSwitch.checked = savedTheme === 'dark';

        // Render initial data
        renderCategories();
        renderTasks();
        updateStats();

        // Set up event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Theme toggle
        themeSwitch.addEventListener('change', toggleTheme);

        // Task modal
        addTaskBtn.addEventListener('click', () => openTaskModal());
        closeModalBtn.addEventListener('click', closeTaskModal);
        cancelTaskBtn.addEventListener('click', closeTaskModal);
        window.addEventListener('click', (e) => {
            if (e.target === taskModal) closeTaskModal();
        });

        // Task form
        taskForm.addEventListener('submit', handleTaskSubmit);

        // Categories
        addCategoryBtn.addEventListener('click', addCategory);
        newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCategory();
        });

        // Search and filters
        taskSearch.addEventListener('input', debounce(renderTasks, 300));
        filterCategory.addEventListener('change', renderTasks);
        filterStatus.addEventListener('change', renderTasks);
        filterPriority.addEventListener('change', renderTasks);

        // Sidebar filters
        allTasksBtn.addEventListener('click', () => {
            setActiveFilter('all');
            renderTasks();
        });
        todayTasksBtn.addEventListener('click', () => {
            setActiveFilter('today');
            renderTasks();
        });
        importantTasksBtn.addEventListener('click', () => {
            setActiveFilter('important');
            renderTasks();
        });
    }

    function toggleTheme() {
        const theme = themeSwitch.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function setActiveFilter(filter) {
        currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.sidebar-menu button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (filter === 'all') allTasksBtn.classList.add('active');
        if (filter === 'today') todayTasksBtn.classList.add('active');
        if (filter === 'important') importantTasksBtn.classList.add('active');
    }

    function openTaskModal(taskId = null) {
        editingTaskId = taskId;
        const modalTitle = document.getElementById('modal-title');
        
        if (taskId) {
            modalTitle.textContent = 'Edit Task';
            const task = tasks.find(t => t.id === taskId);
            populateTaskForm(task);
        } else {
            modalTitle.textContent = 'Add New Task';
            resetTaskForm();
        }
        
        taskModal.style.display = 'flex';
    }

    function closeTaskModal() {
        taskModal.style.display = 'none';
        editingTaskId = null;
    }

    function resetTaskForm() {
        document.getElementById('task-id').value = '';
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-category').value = 'uncategorized';
        document.getElementById('task-important').checked = false;
    }

    function populateTaskForm(task) {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-due-date').value = task.dueDate || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-category').value = task.category || 'uncategorized';
        document.getElementById('task-important').checked = task.important || false;
    }

    function handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(taskForm);
        const taskData = {
            id: formData.get('task-id') || generateId(),
            title: formData.get('task-title'),
            description: formData.get('task-description'),
            dueDate: formData.get('task-due-date'),
            priority: formData.get('task-priority'),
            category: formData.get('task-category'),
            important: formData.get('task-important') === 'on',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        if (editingTaskId) {
            // Update existing task
            tasks = tasks.map(task => 
                task.id === editingTaskId ? { ...task, ...taskData } : task
            );
        } else {
            // Add new task
            tasks.push(taskData);
        }
        
        saveTasks();
        renderTasks();
        closeTaskModal();
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function renderTasks() {
        const searchTerm = taskSearch.value.toLowerCase();
        const categoryFilter = filterCategory.value;
        const statusFilter = filterStatus.value;
        const priorityFilter = filterPriority.value;
        
        let filteredTasks = tasks.filter(task => {
            // Apply search filter
            const matchesSearch = 
                task.title.toLowerCase().includes(searchTerm) || 
                (task.description && task.description.toLowerCase().includes(searchTerm));
            
            // Apply category filter
            const matchesCategory = 
                categoryFilter === 'all' || 
                task.category === categoryFilter ||
                (categoryFilter === 'uncategorized' && !task.category);
            
            // Apply status filter
            const matchesStatus = 
                statusFilter === 'all' || 
                (statusFilter === 'completed' && task.completed) || 
                (statusFilter === 'pending' && !task.completed);
            
            // Apply priority filter
            const matchesPriority = 
                priorityFilter === 'all' || 
                task.priority === priorityFilter;
            
            // Apply sidebar filters
            let matchesSidebarFilter = true;
            if (currentFilter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                matchesSidebarFilter = task.dueDate === today;
            } else if (currentFilter === 'important') {
                matchesSidebarFilter = task.important;
            }
            
            return matchesSearch && matchesCategory && matchesStatus && matchesPriority && matchesSidebarFilter;
        });
        
        // Sort tasks: important first, then by due date (soonest first), then by creation date (newest first)
        filteredTasks.sort((a, b) => {
            if (a.important !== b.important) return b.important - a.important;
            if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Clear the tasks list
        tasksList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '<li class="no-tasks">No tasks found. Add a new task to get started!</li>';
            return;
        }
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isOverdue = dueDate && dueDate < today && !task.completed;
            
            taskItem.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-content">
                    <h3 class="task-title">
                        ${task.title}
                        ${task.important ? '<i class="fas fa-star important-icon"></i>' : ''}
                    </h3>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    <div class="task-meta">
                        ${task.category && task.category !== 'uncategorized' ? 
                            `<span class="task-category">${task.category}</span>` : ''}
                        ${dueDate ? `
                            <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                <i class="far fa-calendar-alt"></i>
                                ${formatDate(dueDate)}
                                ${isOverdue ? '<i class="fas fa-exclamation-circle"></i>' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit task"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete task"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            // Add event listeners to the task item
            const checkbox = taskItem.querySelector('.task-checkbox input');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            editBtn.addEventListener('click', () => openTaskModal(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            tasksList.appendChild(taskItem);
        });
        
        updateStats();
    }

    function toggleTaskComplete(taskId) {
        tasks = tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
        }
    }

    function renderCategories() {
        // Clear the categories list
        categoriesList.innerHTML = '';
        
        // Add default "Uncategorized" option
        const uncategorizedItem = document.createElement('li');
        uncategorizedItem.className = 'active';
        uncategorizedItem.textContent = 'Uncategorized';
        uncategorizedItem.dataset.category = 'uncategorized';
        uncategorizedItem.addEventListener('click', () => {
            document.querySelectorAll('#categories-list li').forEach(li => li.classList.remove('active'));
            uncategorizedItem.classList.add('active');
            filterCategory.value = 'uncategorized';
            renderTasks();
        });
        categoriesList.appendChild(uncategorizedItem);
        
        // Add user categories
        categories.forEach(category => {
            const categoryItem = document.createElement('li');
            categoryItem.textContent = category;
            categoryItem.dataset.category = category;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'category-actions';
            actionsDiv.innerHTML = '<button class="delete-category-btn"><i class="fas fa-trash-alt"></i></button>';
            
            categoryItem.appendChild(actionsDiv);
            
            categoryItem.addEventListener('click', (e) => {
                if (!e.target.closest('.category-actions')) {
                    document.querySelectorAll('#categories-list li').forEach(li => li.classList.remove('active'));
                    categoryItem.classList.add('active');
                    filterCategory.value = category;
                    renderTasks();
                }
            });
            
            const deleteBtn = categoryItem.querySelector('.delete-category-btn');
            deleteBtn.addEventListener('click', () => deleteCategory(category));
            
            categoriesList.appendChild(categoryItem);
        });
        
        // Update category selects in forms
        updateCategorySelects();
    }

    function addCategory() {
        const categoryName = newCategoryInput.value.trim();
        
        if (categoryName && !categories.includes(categoryName)) {
            categories.push(categoryName);
            saveCategories();
            renderCategories();
            newCategoryInput.value = '';
        }
    }

    function deleteCategory(categoryName) {
        if (confirm(`Delete category "${categoryName}"? Tasks in this category will be moved to Uncategorized.`)) {
            // Remove category from tasks
            tasks = tasks.map(task => 
                task.category === categoryName ? { ...task, category: 'uncategorized' } : task
            );
            
            // Remove category from list
            categories = categories.filter(cat => cat !== categoryName);
            
            saveTasks();
            saveCategories();
            renderCategories();
            renderTasks();
        }
    }

    function updateCategorySelects() {
        // Update category select in task form
        taskCategorySelect.innerHTML = '<option value="uncategorized">Uncategorized</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            taskCategorySelect.appendChild(option);
        });
        
        // Update category filter
        filterCategorySelect.innerHTML = '<option value="all">All Categories</option><option value="uncategorized">Uncategorized</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
    }

    function formatDate(date) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});
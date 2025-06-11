// DOM元素
const newTaskInput = document.getElementById('new-task');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksList = document.getElementById('tasks-list');
const currentDateElement = document.getElementById('current-date');
const prevDateBtn = document.getElementById('prev-date');
const nextDateBtn = document.getElementById('next-date');
const progressBar = document.getElementById('progress');
const completionRate = document.getElementById('completion-rate');
const calendarElement = document.getElementById('calendar');
const photoModal = document.getElementById('photo-modal');
const closeModal = document.querySelector('.close');
const taskPhotoInput = document.getElementById('task-photo');
const photoPreview = document.getElementById('photo-preview');
const submitPhotoBtn = document.getElementById('submit-photo');

// 当前日期和当前选中的任务
let currentDate = new Date();
let currentTask = null;

// 初始化应用
function initApp() {
    updateDateDisplay();
    loadTasks();
    updateCompletionStatus();
    renderCalendar();
    setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
    // 添加任务
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // 日期导航
    prevDateBtn.addEventListener('click', () => changeDate(-1));
    nextDateBtn.addEventListener('click', () => changeDate(1));

    // 照片模态框
    closeModal.addEventListener('click', closePhotoModal);
    window.addEventListener('click', (e) => {
        if (e.target === photoModal) closePhotoModal();
    });

    // 照片上传预览
    taskPhotoInput.addEventListener('change', previewPhoto);
    submitPhotoBtn.addEventListener('click', submitPhoto);
}

// 更新日期显示
function updateDateDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    currentDateElement.textContent = currentDate.toLocaleDateString('zh-CN', options);
}

// 改变当前日期
function changeDate(days) {
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + days));
    updateDateDisplay();
    loadTasks();
    updateCompletionStatus();
    renderCalendar();
}

// 获取当前日期的格式化字符串（用作存储键）
function getDateKey(date = currentDate) {
    return date.toISOString().split('T')[0];
}

// 从localStorage加载任务
function loadTasks() {
    const dateKey = getDateKey();
    const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
    renderTasks(tasks);
}

// 渲染任务列表
function renderTasks(tasks) {
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="no-tasks">今天还没有任务，添加一些吧！</div>';
        return;
    }

    tasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
        taskItem.dataset.index = index;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompletion(index));

        const taskText = document.createElement('div');
        taskText.className = 'task-text';
        taskText.textContent = task.text;

        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';

        // 如果有照片证明，显示缩略图
        if (task.photoProof) {
            const photoThumb = document.createElement('img');
            photoThumb.src = task.photoProof;
            photoThumb.className = 'task-photo-proof';
            photoThumb.addEventListener('click', () => showFullScreenPhoto(task.photoProof));
            taskActions.appendChild(photoThumb);
        }

        // 上传照片按钮
        const photoBtn = document.createElement('button');
        photoBtn.className = 'photo-btn';
        photoBtn.innerHTML = '<i class="fas fa-camera"></i>';
        photoBtn.addEventListener('click', () => openPhotoModal(index));

        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteTask(index));

        taskActions.appendChild(photoBtn);
        taskActions.appendChild(deleteBtn);

        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskText);
        taskItem.appendChild(taskActions);

        tasksList.appendChild(taskItem);
    });
}

// 添加新任务
function addTask() {
    const taskText = newTaskInput.value.trim();
    if (!taskText) return;

    const dateKey = getDateKey();
    const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
    
    tasks.push({
        text: taskText,
        completed: false,
        photoProof: null,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem(dateKey, JSON.stringify(tasks));
    newTaskInput.value = '';
    loadTasks();
    updateCompletionStatus();
    renderCalendar();
}

// 切换任务完成状态
function toggleTaskCompletion(index) {
    const dateKey = getDateKey();
    const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
    
    if (tasks[index]) {
        tasks[index].completed = !tasks[index].completed;
        
        // 如果标记为完成且没有照片证明，打开照片上传模态框
        if (tasks[index].completed && !tasks[index].photoProof) {
            openPhotoModal(index);
        }
        
        localStorage.setItem(dateKey, JSON.stringify(tasks));
        loadTasks();
        updateCompletionStatus();
        renderCalendar();
    }
}

// 删除任务
function deleteTask(index) {
    if (!confirm('确定要删除这个任务吗？')) return;
    
    const dateKey = getDateKey();
    const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
    
    if (tasks[index]) {
        tasks.splice(index, 1);
        localStorage.setItem(dateKey, JSON.stringify(tasks));
        loadTasks();
        updateCompletionStatus();
        renderCalendar();
    }
}

// 更新完成状态
function updateCompletionStatus() {
    const dateKey = getDateKey();
    const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
    
    if (tasks.length === 0) {
        progressBar.style.width = '0%';
        completionRate.textContent = '0%';
        return;
    }
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionPercentage = Math.round((completedTasks / tasks.length) * 100);
    
    progressBar.style.width = `${completionPercentage}%`;
    completionRate.textContent = `${completionPercentage}%`;
}

// 渲染日历视图
function renderCalendar() {
    calendarElement.innerHTML = '';
    
    // 获取当前月的第一天
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // 获取当前月的最后一天
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // 获取当前月第一天是星期几（0-6，0是星期日）
    const firstDayOfWeek = firstDay.getDay();
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-weekday';
        dayElement.textContent = day;
        calendarElement.appendChild(dayElement);
    });
    
    // 添加空白格子直到第一天
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarElement.appendChild(emptyDay);
    }
    
    // 添加当月的天数
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayElement = document.createElement('div');
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dayKey = getDateKey(dayDate);
        const tasks = JSON.parse(localStorage.getItem(dayKey)) || [];
        
        dayElement.className = 'calendar-day';
        
        // 检查是否是今天
        const today = new Date();
        if (dayDate.getDate() === today.getDate() && 
            dayDate.getMonth() === today.getMonth() && 
            dayDate.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // 检查是否是当前选中日期
        if (dayDate.getDate() === currentDate.getDate() && 
            dayDate.getMonth() === currentDate.getMonth() && 
            dayDate.getFullYear() === currentDate.getFullYear()) {
            dayElement.classList.add('selected');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = i;
        
        const dayStatus = document.createElement('div');
        dayStatus.className = 'calendar-day-status';
        
        // 确定日期状态
        if (tasks.length > 0) {
            const completedTasks = tasks.filter(task => task.completed).length;
            if (completedTasks === tasks.length) {
                dayStatus.classList.add('status-complete');
            } else if (completedTasks > 0) {
                dayStatus.classList.add('status-partial');
            } else {
                dayStatus.classList.add('status-incomplete');
            }
        } else {
            // 未来日期
            if (dayDate > today) {
                dayStatus.classList.add('status-future');
            } else {
                dayStatus.classList.add('status-incomplete');
            }
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayStatus);
        
        // 添加点击事件，切换到该日期
        dayElement.addEventListener('click', () => {
            currentDate = dayDate;
            updateDateDisplay();
            loadTasks();
            updateCompletionStatus();
            renderCalendar();
        });
        
        calendarElement.appendChild(dayElement);
    }
}

// 打开照片上传模态框
function openPhotoModal(taskIndex) {
    currentTask = taskIndex;
    photoPreview.innerHTML = '';
    taskPhotoInput.value = '';
    photoModal.style.display = 'block';
}

// 关闭照片上传模态框
function closePhotoModal() {
    photoModal.style.display = 'none';
    currentTask = null;
}

// 预览选择的照片
function previewPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        photoPreview.innerHTML = `<img src="${event.target.result}" alt="任务照片预览">`;
    };
    reader.readAsDataURL(file);
}

// 提交照片
function submitPhoto() {
    if (currentTask === null) return;
    
    const photoImg = photoPreview.querySelector('img');
    if (!photoImg) {
        alert('请先选择一张照片');
        return;
    }
    
    const dateKey = getDateKey();
    const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
    
    if (tasks[currentTask]) {
        tasks[currentTask].photoProof = photoImg.src;
        tasks[currentTask].completed = true; // 上传照片后自动标记为完成
        
        localStorage.setItem(dateKey, JSON.stringify(tasks));
        closePhotoModal();
        loadTasks();
        updateCompletionStatus();
    }
}

// 显示照片全屏预览
function showFullScreenPhoto(photoSrc) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'photo-fullscreen';
    
    const img = document.createElement('img');
    img.src = photoSrc;
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => document.body.removeChild(fullscreenDiv));
    
    fullscreenDiv.appendChild(img);
    fullscreenDiv.appendChild(closeBtn);
    
    fullscreenDiv.addEventListener('click', (e) => {
        if (e.target === fullscreenDiv) document.body.removeChild(fullscreenDiv);
    });
    
    document.body.appendChild(fullscreenDiv);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);
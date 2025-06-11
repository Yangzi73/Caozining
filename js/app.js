// DOM元素
const newTaskInput = document.getElementById('new-task');
const addTaskBtn = document.getElementById('add-task-btn');
const addTaskIcon = document.getElementById('add-task-icon');
const addTaskModal = document.getElementById('add-task-modal');
const tasksList = document.getElementById('tasks-list');
const currentDateElement = document.getElementById('current-date');
const prevDateBtn = document.getElementById('prev-date');
const nextDateBtn = document.getElementById('next-date');
const progressBar = document.getElementById('progress');
const completionRate = document.getElementById('completion-rate');
const calendarElement = document.getElementById('calendar');
const photoModal = document.getElementById('photo-modal');
const closeModalButtons = document.querySelectorAll('.close');
const taskPhotoInput = document.getElementById('task-photo');
const photoPreview = document.getElementById('photo-preview');
const submitPhotoBtn = document.getElementById('submit-photo');

// 当前日期和当前选中的任务
let currentDate = new Date();
let currentTask = null;

// 添加新的DOM元素
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const streakDaysElement = document.getElementById('streak-days');
const totalCompletedElement = document.getElementById('total-completed');
const maxStreakElement = document.getElementById('max-streak');
const monthlyChartElement = document.getElementById('monthly-chart');

// 初始化应用
function initApp() {
    updateDateDisplay();
    loadTasks();
    updateCompletionStatus();
    renderCalendar();
    setupEventListeners();
    cleanupOldPhotos(); // 清理旧照片
    updateStatistics(); // 更新统计数据
}

// 设置事件监听器
function setupEventListeners() {
    // 添加任务图标点击事件
    addTaskIcon.addEventListener('click', openAddTaskModal);
    
    // 添加任务
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // 日期导航
    prevDateBtn.addEventListener('click', () => changeDate(-1));
    nextDateBtn.addEventListener('click', () => changeDate(1));

    // 模态框关闭按钮
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            addTaskModal.style.display = 'none';
            photoModal.style.display = 'none';
            currentTask = null;
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === addTaskModal) addTaskModal.style.display = 'none';
        if (e.target === photoModal) photoModal.style.display = 'none';
    });

    // 照片上传预览
    taskPhotoInput.addEventListener('change', previewPhoto);
    submitPhotoBtn.addEventListener('click', submitPhoto);
    
    // 导航按钮点击事件
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPage = button.getAttribute('data-page');
            switchPage(targetPage);
        });
    });
}

// 切换页面
function switchPage(pageId) {
    // 移除所有页面和导航按钮的active类
    pages.forEach(page => page.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // 添加active类到目标页面和对应的导航按钮
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    
    // 如果切换到统计页面，更新统计数据
    if (pageId === 'stats-page') {
        updateStatistics();
    }
    
    // 如果切换到历史页面，确保日历是最新的
    if (pageId === 'history-page') {
        renderCalendar();
    }
}

// 更新统计数据
function updateStatistics() {
    const stats = calculateStatistics();
    
    // 更新DOM元素
    streakDaysElement.textContent = stats.currentStreak;
    totalCompletedElement.textContent = stats.totalCompleted;
    maxStreakElement.textContent = stats.maxStreak;
    
    // 渲染月度图表
    renderMonthlyChart(stats.monthlyData);
}

// 计算统计数据
function calculateStatistics() {
    const taskDates = JSON.parse(localStorage.getItem('taskDates')) || [];
    let currentStreak = 0;
    let maxStreak = 0;
    let totalCompleted = 0;
    let tempStreak = 0;
    let monthlyData = {};
    
    // 获取今天的日期（重置时间部分）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getDateKey(today);
    
    // 按日期排序
    taskDates.sort();
    
    // 计算每个月的完成情况
    taskDates.forEach(dateKey => {
        const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        
        // 计算总完成任务数
        totalCompleted += completedTasks;
        
        // 如果有任务且全部完成，计入连续天数
        if (totalTasks > 0 && completedTasks === totalTasks) {
            tempStreak++;
            
            // 如果是今天或之前的日期，更新当前连续天数
            const taskDate = new Date(dateKey);
            if (taskDate <= today) {
                // 检查是否是连续的日期
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayKey = getDateKey(yesterday);
                
                if (dateKey === todayKey || dateKey === yesterdayKey) {
                    currentStreak = tempStreak;
                }
            }
        } else {
            // 重置临时连续天数
            tempStreak = 0;
        }
        
        // 更新最大连续天数
        maxStreak = Math.max(maxStreak, tempStreak);
        
        // 更新月度数据
        const month = dateKey.substring(0, 7); // 格式：YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = {
                completed: 0,
                total: 0
            };
        }
        monthlyData[month].completed += completedTasks;
        monthlyData[month].total += totalTasks;
    });
    
    return {
        currentStreak,
        maxStreak,
        totalCompleted,
        monthlyData
    };
}

// 渲染月度图表
function renderMonthlyChart(monthlyData) {
    monthlyChartElement.innerHTML = '';
    
    // 获取最近6个月的数据
    const months = Object.keys(monthlyData).sort().slice(-6);
    
    // 如果没有数据，显示提示信息
    if (months.length === 0) {
        monthlyChartElement.innerHTML = '<div class="no-data">暂无数据</div>';
        return;
    }
    
    // 找出最大值，用于计算比例
    let maxValue = 0;
    months.forEach(month => {
        const data = monthlyData[month];
        const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        maxValue = Math.max(maxValue, percentage);
    });
    
    // 创建图表柱形
    months.forEach(month => {
        const data = monthlyData[month];
        const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        const height = maxValue > 0 ? (percentage / maxValue) * 100 : 0;
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${height}%`;
        bar.setAttribute('data-value', `${percentage}% (${data.completed}/${data.total})`);
        
        const monthLabel = document.createElement('div');
        monthLabel.className = 'chart-label';
        monthLabel.textContent = month.substring(5); // 只显示MM部分
        
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        barContainer.appendChild(bar);
        barContainer.appendChild(monthLabel);
        
        monthlyChartElement.appendChild(barContainer);
    });
}

// 打开添加任务模态框
function openAddTaskModal() {
    newTaskInput.value = '';
    addTaskModal.style.display = 'block';
    newTaskInput.focus();
}

// 更新日期显示
function updateDateDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    currentDateElement.textContent = currentDate.toLocaleDateString('zh-CN', options);
}

// 改变当前日期
function changeDate(days) {
    // 获取今天的日期（重置时间部分）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 计算新日期
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    
    // 如果是未来日期，不允许选择
    if (newDate > today) return;
    
    currentDate = newDate;
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
        tasksList.innerHTML = '<div class="no-tasks">今天还没有任务，点击右上角加号添加任务！</div>';
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

    // 保存任务到localStorage
    localStorage.setItem(dateKey, JSON.stringify(tasks));
    
    // 保存所有任务的日期列表，用于持久化
    saveTaskDates(dateKey);
    
    newTaskInput.value = '';
    addTaskModal.style.display = 'none';
    loadTasks();
    updateCompletionStatus();
    renderCalendar();
}

// 保存任务日期列表
function saveTaskDates(dateKey) {
    let taskDates = JSON.parse(localStorage.getItem('taskDates')) || [];
    if (!taskDates.includes(dateKey)) {
        taskDates.push(dateKey);
        localStorage.setItem('taskDates', JSON.stringify(taskDates));
    }
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
        // 如果有照片，从存储中删除
        if (tasks[index].photoProof) {
            // 这里只是从任务中移除照片引用，实际照片数据仍在localStorage中
            // 每日清理会处理未引用的照片
        }
        
        tasks.splice(index, 1);
        localStorage.setItem(dateKey, JSON.stringify(tasks));
        
        // 如果没有任务了，从日期列表中移除
        if (tasks.length === 0) {
            let taskDates = JSON.parse(localStorage.getItem('taskDates')) || [];
            taskDates = taskDates.filter(date => date !== dateKey);
            localStorage.setItem('taskDates', JSON.stringify(taskDates));
        }
        
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
            // 不允许选择未来日期
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dayDate > today) return;
            
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
        // 保存照片到任务
        tasks[currentTask].photoProof = photoImg.src;
        tasks[currentTask].completed = true; // 上传照片后自动标记为完成
        tasks[currentTask].photoDate = new Date().toISOString(); // 记录照片上传日期
        
        localStorage.setItem(dateKey, JSON.stringify(tasks));
        closePhotoModal();
        loadTasks();
        updateCompletionStatus();
    }
}

// 清理旧照片（每日执行一次）
function cleanupOldPhotos() {
    // 获取今天的日期
    const today = new Date();
    const todayKey = getDateKey(today);
    
    // 获取昨天的日期
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);
    
    // 获取所有任务日期
    const taskDates = JSON.parse(localStorage.getItem('taskDates')) || [];
    
    // 遍历所有日期，清理非当天的照片
    taskDates.forEach(dateKey => {
        if (dateKey !== todayKey) {
            const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
            let modified = false;
            
            // 检查每个任务的照片日期
            tasks.forEach(task => {
                if (task.photoProof && task.photoDate) {
                    const photoDate = new Date(task.photoDate);
                    const photoDateKey = getDateKey(photoDate);
                    
                    // 如果照片不是今天上传的，清除照片数据但保留完成状态
                    if (photoDateKey !== todayKey) {
                        task.photoProof = null;
                        modified = true;
                    }
                }
            });
            
            // 如果有修改，保存回localStorage
            if (modified) {
                localStorage.setItem(dateKey, JSON.stringify(tasks));
            }
        }
    });
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
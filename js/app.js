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

// 反思总结相关元素
const reflectionText = document.getElementById('reflection-text');
const saveReflectionBtn = document.getElementById('save-reflection');
const reflectionHistory = document.getElementById('reflection-history');
const reflectionModal = document.getElementById('reflection-modal');
const reflectionDate = document.getElementById('reflection-date');
const reflectionModalContent = document.getElementById('reflection-modal-content');

// 月份选择器相关元素
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthElement = document.getElementById('current-month');

// 当前选择的月份（用于月度图表）
let currentChartMonth = new Date();

// 初始化应用
function initApp() {
    updateDateDisplay();
    loadTasks();
    updateCompletionStatus();
    renderCalendar();
    setupEventListeners();
    //cleanupOldPhotos(); // 清理旧照片
    updateStatistics(); // 更新统计数据
    loadReflection(); // 加载当天的反思总结
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
            reflectionModal.style.display = 'none';
            currentTask = null;
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === addTaskModal) addTaskModal.style.display = 'none';
        if (e.target === photoModal) photoModal.style.display = 'none';
        if (e.target === reflectionModal) reflectionModal.style.display = 'none';
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
    
    // 保存反思总结
    saveReflectionBtn.addEventListener('click', saveReflection);
    
    // 月份选择器
    prevMonthBtn.addEventListener('click', () => changeChartMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeChartMonth(1));
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
    
    // 更新当前月份显示
    updateCurrentMonthDisplay();
    
    // 渲染月度图表
    renderMonthlyChart(stats.monthlyData);
}

// 更新当前月份显示
function updateCurrentMonthDisplay() {
    const options = { year: 'numeric', month: 'long' };
    currentMonthElement.textContent = currentChartMonth.toLocaleDateString('zh-CN', options);
}

// 切换图表月份
function changeChartMonth(months) {
    currentChartMonth.setMonth(currentChartMonth.getMonth() + months);
    updateCurrentMonthDisplay();
    updateStatistics();
}

// 计算统计数据
function calculateStatistics() {
    const taskDates = JSON.parse(localStorage.getItem('taskDates')) || [];
    let currentStreak = 0;
    let maxStreak = 0;
    let totalCompleted = 0;
    let tempStreak = 0;
    let monthlyData = {};
    let monthlyCompletedDays = {}; // 新增：每月完成天数
    
    // 获取今天的日期（重置时间部分）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getDateKey(today);
    
    // 按日期排序
    taskDates.sort();
    
    // 检查是否有连续的日期
    let lastDate = null;
    let currentStreakDates = [];
    
    // 计算每个月的完成情况
    taskDates.forEach(dateKey => {
        const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        
        // 计算总完成任务数
        totalCompleted += completedTasks;
        
        // 处理连续天数计算
        const taskDate = new Date(dateKey + 'T00:00:00');
        
        // 如果有任务且全部完成
        if (totalTasks > 0 && completedTasks === totalTasks) {
            // 如果是第一个日期或者与上一个日期相差一天
            if (lastDate === null || 
                (taskDate.getTime() - lastDate.getTime()) === 86400000) {
                tempStreak++;
                currentStreakDates.push(dateKey);
            } else {
                // 不连续，重置临时连续天数
                tempStreak = 1;
                currentStreakDates = [dateKey];
            }
            
            // 更新最后一个日期
            lastDate = taskDate;
            
            // 更新最大连续天数
            maxStreak = Math.max(maxStreak, tempStreak);
            
            // 新增：更新每月完成天数
            const month = dateKey.substring(0, 7); // 格式：YYYY-MM
            if (!monthlyCompletedDays[month]) {
                monthlyCompletedDays[month] = new Set();
            }
            monthlyCompletedDays[month].add(dateKey);
        } else {
            // 有未完成任务，重置临时连续天数
            tempStreak = 0;
            currentStreakDates = [];
            lastDate = null;
        }
        
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
    
    // 检查当前连续天数是否包含今天或昨天
    if (currentStreakDates.length > 0) {
        const lastStreakDate = new Date(currentStreakDates[currentStreakDates.length - 1] + 'T00:00:00');
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // 如果最后一个连续日期是今天或昨天，则当前连续天数有效
        if (isSameDay(lastStreakDate, today) || isSameDay(lastStreakDate, yesterday)) {
            currentStreak = tempStreak;
        } else {
            currentStreak = 0;
        }
    }
    
    // 转换每月完成天数为数字
    const monthlyCompletedDaysCount = {};
    for (const month in monthlyCompletedDays) {
        monthlyCompletedDaysCount[month] = monthlyCompletedDays[month].size;
    }
    
    return {
        currentStreak,
        maxStreak,
        totalCompleted,
        monthlyData,
        monthlyCompletedDaysCount // 新增：返回每月完成天数
    };
}

// 检查两个日期是否是同一天
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 渲染月度图表
function renderMonthlyChart(monthlyData) {
    monthlyChartElement.innerHTML = '';
    
    // 获取当前选择月份的年月
    const year = currentChartMonth.getFullYear();
    const month = (currentChartMonth.getMonth() + 1).toString().padStart(2, '0');
    const selectedMonth = `${year}-${month}`;
    
    // 获取当月的天数
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 获取统计数据
    const stats = calculateStatistics();
    const completedDays = stats.monthlyCompletedDaysCount[selectedMonth] || 0;
    
    // 添加每月完成天数显示
    const completedDaysElement = document.createElement('div');
    completedDaysElement.className = 'monthly-completed-days';
    completedDaysElement.innerHTML = `<h3>每月完成天数</h3><div class="stats-number">${completedDays}</div>`;
    monthlyChartElement.appendChild(completedDaysElement);
    
    // 如果没有数据，显示提示信息
    if (!monthlyData[selectedMonth]) {
        const noDataElement = document.createElement('div');
        noDataElement.className = 'no-data';
        noDataElement.textContent = '暂无任务数据';
        monthlyChartElement.appendChild(noDataElement);
        return;
    }
    
    // 创建每天的数据
    const dailyData = {};
    
    // 初始化每天的数据为0
    for (let i = 1; i <= daysInMonth; i++) {
        const day = i.toString().padStart(2, '0');
        const dateKey = `${selectedMonth}-${day}`;
        dailyData[dateKey] = {
            completed: 0,
            total: 0
        };
    }
    
    // 填充实际数据
    const taskDates = JSON.parse(localStorage.getItem('taskDates')) || [];
    taskDates.forEach(dateKey => {
        if (dateKey.startsWith(selectedMonth)) {
            const tasks = JSON.parse(localStorage.getItem(dateKey)) || [];
            const completedTasks = tasks.filter(task => task.completed).length;
            dailyData[dateKey] = {
                completed: completedTasks,
                total: tasks.length
            };
        }
    });
    
    // 找出最大值，用于计算比例
    let maxValue = 0;
    Object.values(dailyData).forEach(data => {
        if (data.total > 0) {
            maxValue = Math.max(maxValue, data.total);
        }
    });
    
    // 创建图表容器
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    monthlyChartElement.appendChild(chartContainer);
    
    // 创建图表柱形
    Object.entries(dailyData).forEach(([dateKey, data]) => {
        const day = dateKey.split('-')[2];
        const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        
        // 计算柱形高度
        const totalHeight = maxValue > 0 ? (data.total / maxValue) * 100 : 0;
        const completedHeight = data.total > 0 ? (data.completed / maxValue) * 100 : 0;
        
        // 创建柱形容器
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        
        // 创建总任务柱形（背景）
        const totalBar = document.createElement('div');
        totalBar.className = 'chart-bar chart-bar-total';
        totalBar.style.height = `${totalHeight}%`;
        totalBar.style.backgroundColor = '#ecf0f1';
        
        // 创建已完成任务柱形
        const completedBar = document.createElement('div');
        completedBar.className = 'chart-bar chart-bar-completed';
        completedBar.style.height = `${completedHeight}%`;
        completedBar.style.backgroundColor = '#3498db';
        completedBar.style.position = 'absolute';
        completedBar.style.bottom = '0';
        completedBar.style.width = '100%';
        
        // 设置提示信息
        barContainer.setAttribute('data-value', 
            `${percentage}% (${data.completed}/${data.total})`);
        
        // 创建日期标签
        const dayLabel = document.createElement('div');
        dayLabel.className = 'chart-label';
        dayLabel.textContent = day;
        
        // 将柱形添加到容器
        const barWrapper = document.createElement('div');
        barWrapper.style.position = 'relative';
        barWrapper.style.width = '100%';
        barWrapper.style.height = '100%';
        
        barWrapper.appendChild(totalBar);
        barWrapper.appendChild(completedBar);
        barContainer.appendChild(barWrapper);
        barContainer.appendChild(dayLabel);
        
        chartContainer.appendChild(barContainer);
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
    loadReflection(); // 加载当天的反思总结
}

// 获取当前日期的格式化字符串（用作存储键）
function getDateKey(date = currentDate) {
    // 修复时区问题，确保使用本地日期
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    updateStatistics();
}

// 保存反思总结
function saveReflection() {
    const text = reflectionText.value.trim();
    if (!text) return;
    
    const dateKey = getDateKey();
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    
    reflections[dateKey] = {
        text: text,
        date: new Date().toISOString()
    };
    
    localStorage.setItem('reflections', JSON.stringify(reflections));
    alert('反思总结已保存！');
    loadReflection();
}

// 加载当天的反思总结
function loadReflection() {
    const dateKey = getDateKey();
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    
    // 加载当天的反思
    if (reflections[dateKey]) {
        reflectionText.value = reflections[dateKey].text;
    } else {
        reflectionText.value = '';
    }
    
    // 加载历史反思
    renderReflectionHistory();
}

// 渲染反思历史
function renderReflectionHistory() {
    reflectionHistory.innerHTML = '';
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    const dateKey = getDateKey();
    
    // 按日期排序（最新的在前面）
    const sortedDates = Object.keys(reflections).sort().reverse();
    
    // 只显示当前日期之前的反思（包括当天）
    const filteredDates = sortedDates.filter(date => {
        const reflectionDate = new Date(date + 'T00:00:00'); // 添加时间部分确保正确解析
        reflectionDate.setHours(0, 0, 0, 0);
        const currentDateCopy = new Date(currentDate);
        currentDateCopy.setHours(0, 0, 0, 0);
        return reflectionDate <= currentDateCopy;
    });
    
    if (filteredDates.length === 0) {
        reflectionHistory.innerHTML = '<div class="no-data">暂无历史反思</div>';
        return;
    }
    
    // 显示最近5条反思
    filteredDates.slice(0, 5).forEach(date => {
        const reflection = reflections[date];
        const reflectionItem = document.createElement('div');
        reflectionItem.className = 'reflection-item';
        reflectionItem.dataset.date = date;
        
        const reflectionDate = document.createElement('div');
        reflectionDate.className = 'reflection-date';
        // 修复日期显示问题
        const dateObj = new Date(date + 'T00:00:00');
        reflectionDate.textContent = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
        
        const reflectionPreview = document.createElement('div');
        reflectionPreview.className = 'reflection-preview';
        reflectionPreview.textContent = reflection.text.substring(0, 50) + 
            (reflection.text.length > 50 ? '...' : '');
        
        reflectionItem.appendChild(reflectionDate);
        reflectionItem.appendChild(reflectionPreview);
        
        // 点击查看完整反思
        reflectionItem.addEventListener('click', () => {
            showReflectionModal(date, reflection.text);
        });
        
        reflectionHistory.appendChild(reflectionItem);
    });
}

// 显示反思模态框
function showReflectionModal(date, text) {
    const dateObj = new Date(date);
    reflectionDate.textContent = dateObj.toLocaleDateString('zh-CN') + ' 反思总结';
    reflectionModalContent.textContent = text;
    reflectionModal.style.display = 'block';
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
        updateStatistics();
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
        updateStatistics();
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
            loadReflection(); // 加载选中日期的反思总结
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
        updateStatistics();
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
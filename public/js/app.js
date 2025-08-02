// Diet Program Application
class DietApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.selectedFoods = [];
        this.weightChart = null;
        
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
        this.setupModals();
        
        if (this.currentUser) {
            this.showMainApp();
            await this.loadDashboardData();
        } else {
            this.showAuthModal();
        }
        
        // Set today's date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('meal-date').value = today;
        document.getElementById('meal-date-filter').value = today;
        document.getElementById('progress-date').value = today;
    }

    // Authentication
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                this.currentUser = await response.json();
                return true;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
        return false;
    }

    async login(username, password) {
        try {
            this.showLoading(true);
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.closeModal('auth-modal');
                this.showMainApp();
                await this.loadDashboardData();
                this.showMessage('Uğurla giriş edildi', 'success');
            } else {
                this.showMessage(data.error || 'Giriş uğursuz oldu', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Giriş zamanı xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async register(formData) {
        try {
            this.showLoading(true);
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = {
                    id: data.userId,
                    username: formData.username,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dailyCalorieGoal: data.dailyCalorieGoal
                };
                this.closeModal('auth-modal');
                this.showMainApp();
                await this.loadDashboardData();
                this.showMessage('Qeydiyyat uğurla tamamlandı', 'success');
            } else {
                this.showMessage(data.error || 'Qeydiyyat uğursuz oldu', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Qeydiyyat zamanı xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.currentUser = null;
            this.showAuthModal();
            this.showMessage('Uğurla çıxış edildi', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // UI Management
    showMainApp() {
        const authModal = document.getElementById('auth-modal');
        authModal.classList.remove('active');
        
        if (this.currentUser) {
            document.getElementById('user-name').textContent = 
                `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
        
        this.showPage('dashboard');
    }

    showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        authModal.classList.add('active');
    }

    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        this.currentPage = pageId;

        // Load page-specific data
        switch (pageId) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'meals':
                this.loadMeals();
                break;
            case 'progress':
                this.loadProgress();
                break;
            case 'diet-plans':
                this.loadDietPlans();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        
        // Reset forms
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Reset selected foods if it's the meal modal
        if (modalId === 'add-meal-modal') {
            this.selectedFoods = [];
            this.updateSelectedFoodsList();
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        // Style based on type
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#d4edda';
                messageEl.style.color = '#155724';
                messageEl.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#f8d7da';
                messageEl.style.color = '#721c24';
                messageEl.style.border = '1px solid #f5c6cb';
                break;
            default:
                messageEl.style.backgroundColor = '#d1ecf1';
                messageEl.style.color = '#0c5460';
                messageEl.style.border = '1px solid #bee5eb';
        }

        document.body.appendChild(messageEl);

        // Remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    // Dashboard
    async loadDashboardData() {
        try {
            const response = await fetch('/api/dashboard');
            if (response.ok) {
                const data = await response.json();
                this.updateDashboard(data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }

        // Load today's meals
        const today = new Date().toISOString().split('T')[0];
        await this.loadRecentMeals(today);
    }

    updateDashboard(data) {
        // Update calorie progress
        document.getElementById('calories-consumed').textContent = data.today.calories;
        document.getElementById('calories-goal').textContent = data.dailyCalorieGoal;
        
        const calorieProgress = (data.today.calories / data.dailyCalorieGoal) * 100;
        document.getElementById('calories-progress').style.width = `${Math.min(calorieProgress, 100)}%`;

        // Update macros
        document.getElementById('protein-consumed').textContent = Math.round(data.today.protein);
        document.getElementById('carbs-consumed').textContent = Math.round(data.today.carbs);
        document.getElementById('fat-consumed').textContent = Math.round(data.today.fat);

        // Update weight info
        if (data.currentWeight) {
            document.getElementById('current-weight').textContent = `${data.currentWeight} kg`;
        }
        if (data.targetWeight) {
            document.getElementById('target-weight').textContent = `${data.targetWeight} kg`;
        }
        if (data.currentWeight && data.targetWeight) {
            const change = data.targetWeight - data.currentWeight;
            document.getElementById('weight-change').textContent = 
                `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`;
        }
    }

    async loadRecentMeals(date) {
        try {
            const response = await fetch(`/api/meals?date=${date}`);
            if (response.ok) {
                const meals = await response.json();
                this.displayRecentMeals(meals.slice(0, 3)); // Show last 3 meals
            }
        } catch (error) {
            console.error('Error loading recent meals:', error);
        }
    }

    displayRecentMeals(meals) {
        const container = document.getElementById('recent-meals');
        
        if (meals.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Bu gün hələ ki heç bir yemək əlavə olunmayıb</p></div>';
            return;
        }

        container.innerHTML = meals.map(meal => `
            <div class="meal-item">
                <div class="meal-item-header">
                    <span class="meal-item-name">${this.getMealTypeName(meal.meal_type)}</span>
                    <span class="meal-item-calories">${meal.total_calories} kal</span>
                </div>
                <div class="meal-item-details">
                    <span>Protein: ${Math.round(meal.total_protein)}g</span>
                    <span>Karbohidrat: ${Math.round(meal.total_carbs)}g</span>
                    <span>Yağ: ${Math.round(meal.total_fat)}g</span>
                </div>
            </div>
        `).join('');
    }

    // Meals
    async loadMeals() {
        const date = document.getElementById('meal-date-filter').value;
        
        try {
            const response = await fetch(`/api/meals?date=${date}`);
            if (response.ok) {
                const meals = await response.json();
                this.displayMealsByType(meals);
            }
        } catch (error) {
            console.error('Error loading meals:', error);
        }
    }

    displayMealsByType(meals) {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        
        mealTypes.forEach(type => {
            const container = document.getElementById(`${type}-meals`);
            const typeMeals = meals.filter(meal => meal.meal_type === type);
            
            if (typeMeals.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Hələ ki ${this.getMealTypeName(type)} əlavə olunmayıb</p>
                    </div>
                `;
            } else {
                container.innerHTML = typeMeals.map(meal => `
                    <div class="meal-item">
                        <div class="meal-item-header">
                            <span class="meal-item-name">${new Date(meal.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span class="meal-item-calories">${meal.total_calories} kal</span>
                        </div>
                        <div class="meal-item-details">
                            <span>Protein: ${Math.round(meal.total_protein)}g</span>
                            <span>Karbohidrat: ${Math.round(meal.total_carbs)}g</span>
                            <span>Yağ: ${Math.round(meal.total_fat)}g</span>
                        </div>
                        <div class="meal-foods">
                            ${meal.items.map(item => `
                                <small>${item.food_name} (${item.quantity}g)</small>
                            `).join(', ')}
                        </div>
                    </div>
                `).join('');
            }
        });
    }

    getMealTypeName(type) {
        const names = {
            'breakfast': 'Səhər Yeməyi',
            'lunch': 'Nahar',
            'dinner': 'Axşam Yeməyi',
            'snack': 'Qəlyanaltı'
        };
        return names[type] || type;
    }

    async showAddMealModal() {
        this.showModal('add-meal-modal');
        await this.loadFoodCategories();
        await this.searchFoods();
    }

    async loadFoodCategories() {
        try {
            const response = await fetch('/api/foods/categories');
            if (response.ok) {
                const categories = await response.json();
                const select = document.getElementById('food-category');
                select.innerHTML = '<option value="">Bütün kateqoriyalar</option>' +
                    categories.map(cat => `<option value="${cat}">${this.getCategoryName(cat)}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    getCategoryName(category) {
        const names = {
            'fruits': 'Meyvələr',
            'vegetables': 'Tərəvəzlər',
            'proteins': 'Zülallı',
            'grains': 'Taxıl',
            'dairy': 'Süd məhsulları',
            'nuts': 'Qoz-fındıq',
            'seeds': 'Toxum'
        };
        return names[category] || category;
    }

    async searchFoods() {
        const search = document.getElementById('food-search').value;
        const category = document.getElementById('food-category').value;
        
        try {
            let url = '/api/foods?';
            if (search) url += `search=${encodeURIComponent(search)}&`;
            if (category) url += `category=${category}&`;
            
            const response = await fetch(url);
            if (response.ok) {
                const foods = await response.json();
                this.displayFoodResults(foods);
            }
        } catch (error) {
            console.error('Error searching foods:', error);
        }
    }

    displayFoodResults(foods) {
        const container = document.getElementById('food-results');
        
        if (foods.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Heç bir nəticə tapılmadı</p></div>';
            return;
        }

        container.innerHTML = foods.map(food => `
            <div class="food-item" onclick="app.addFoodToMeal(${food.id})">
                <div class="food-item-name">${food.name}</div>
                <div class="food-item-info">
                    <span>${food.category}</span>
                    <span>${food.calories_per_100g} kal/100g</span>
                </div>
            </div>
        `).join('');
    }

    async addFoodToMeal(foodId) {
        try {
            const response = await fetch(`/api/foods?search=&category=`);
            if (response.ok) {
                const foods = await response.json();
                const food = foods.find(f => f.id === foodId);
                
                if (food) {
                    const existingFood = this.selectedFoods.find(f => f.id === foodId);
                    if (existingFood) {
                        existingFood.quantity += 100;
                    } else {
                        this.selectedFoods.push({
                            ...food,
                            quantity: 100
                        });
                    }
                    this.updateSelectedFoodsList();
                }
            }
        } catch (error) {
            console.error('Error adding food:', error);
        }
    }

    updateSelectedFoodsList() {
        const container = document.getElementById('selected-foods-list');
        
        if (this.selectedFoods.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Hələ ki heç bir qida seçilməyib</p></div>';
            document.getElementById('meal-total-calories').textContent = '0';
            return;
        }

        let totalCalories = 0;

        container.innerHTML = this.selectedFoods.map((food, index) => {
            const calories = Math.round((food.calories_per_100g * food.quantity) / 100);
            totalCalories += calories;

            return `
                <div class="selected-food-item">
                    <div class="selected-food-info">
                        <div class="selected-food-name">${food.name}</div>
                        <div class="selected-food-details">${calories} kalori</div>
                    </div>
                    <input type="number" class="quantity-input" value="${food.quantity}" 
                           min="1" step="1" onchange="app.updateFoodQuantity(${index}, this.value)">
                    <button type="button" class="remove-food" onclick="app.removeFoodFromMeal(${index})">×</button>
                </div>
            `;
        }).join('');

        document.getElementById('meal-total-calories').textContent = totalCalories;
    }

    updateFoodQuantity(index, quantity) {
        this.selectedFoods[index].quantity = parseInt(quantity);
        this.updateSelectedFoodsList();
    }

    removeFoodFromMeal(index) {
        this.selectedFoods.splice(index, 1);
        this.updateSelectedFoodsList();
    }

    async submitMeal(formData) {
        if (this.selectedFoods.length === 0) {
            this.showMessage('Ən azı bir qida seçməlisiniz', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const mealData = {
                mealType: formData.get('meal-type'),
                mealDate: formData.get('meal-date'),
                items: this.selectedFoods.map(food => ({
                    foodItemId: food.id,
                    quantity: food.quantity
                }))
            };

            const response = await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mealData)
            });

            if (response.ok) {
                this.closeModal('add-meal-modal');
                this.showMessage('Yemək uğurla əlavə edildi', 'success');
                
                if (this.currentPage === 'meals') {
                    await this.loadMeals();
                }
                if (this.currentPage === 'dashboard') {
                    await this.loadDashboardData();
                }
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Yemək əlavə edilərkən xəta baş verdi', 'error');
            }
        } catch (error) {
            console.error('Error submitting meal:', error);
            this.showMessage('Yemək əlavə edilərkən xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Progress
    async loadProgress() {
        try {
            const response = await fetch('/api/progress');
            if (response.ok) {
                const progress = await response.json();
                this.displayProgress(progress);
                this.createWeightChart(progress);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    displayProgress(progressData) {
        const container = document.getElementById('progress-history');
        
        if (progressData.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Hələ ki heç bir tərəqqi qeydiyyatı yoxdur</p></div>';
            return;
        }

        container.innerHTML = progressData.map(progress => `
            <div class="progress-item">
                <div class="progress-item-date">${new Date(progress.date).toLocaleDateString('az-AZ')}</div>
                <div class="progress-item-details">
                    ${progress.weight ? `<span>Çəki: ${progress.weight} kg</span>` : ''}
                    ${progress.water_intake ? `<span>Su: ${progress.water_intake} ml</span>` : ''}
                    ${progress.exercise_minutes ? `<span>İdman: ${progress.exercise_minutes} dəq</span>` : ''}
                    ${progress.notes ? `<span>Qeyd: ${progress.notes}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    createWeightChart(progressData) {
        const ctx = document.getElementById('weight-chart').getContext('2d');
        
        if (this.weightChart) {
            this.weightChart.destroy();
        }

        const weightData = progressData
            .filter(p => p.weight)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-30); // Last 30 entries

        this.weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weightData.map(d => new Date(d.date).toLocaleDateString('az-AZ')),
                datasets: [{
                    label: 'Çəki (kg)',
                    data: weightData.map(d => d.weight),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    async submitProgress(formData) {
        try {
            this.showLoading(true);
            
            const progressData = {
                date: formData.get('progress-date'),
                weight: formData.get('progress-weight') || null,
                waterIntake: formData.get('progress-water') || null,
                exerciseMinutes: formData.get('progress-exercise') || null,
                notes: formData.get('progress-notes') || null
            };

            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progressData)
            });

            if (response.ok) {
                this.closeModal('add-progress-modal');
                this.showMessage('Tərəqqi uğurla əlavə edildi', 'success');
                
                if (this.currentPage === 'progress') {
                    await this.loadProgress();
                }
                if (this.currentPage === 'dashboard') {
                    await this.loadDashboardData();
                }
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Tərəqqi əlavə edilərkən xəta baş verdi', 'error');
            }
        } catch (error) {
            console.error('Error submitting progress:', error);
            this.showMessage('Tərəqqi əlavə edilərkən xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Diet Plans
    async loadDietPlans() {
        try {
            const response = await fetch('/api/diet-plans');
            if (response.ok) {
                const plans = await response.json();
                this.displayDietPlans(plans);
            }
        } catch (error) {
            console.error('Error loading diet plans:', error);
        }
    }

    displayDietPlans(plans) {
        const container = document.getElementById('diet-plans-list');
        
        if (plans.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Heç bir diyet planı mövcud deyil</p></div>';
            return;
        }

        container.innerHTML = plans.map(plan => `
            <div class="diet-plan-card" onclick="app.viewDietPlan(${plan.id})">
                <div class="diet-plan-name">${plan.name}</div>
                <div class="diet-plan-description">${plan.description}</div>
                <div class="diet-plan-info">
                    <span>${plan.duration_days} gün</span>
                    <span>${plan.target_calories} kalori</span>
                </div>
            </div>
        `).join('');
    }

    async viewDietPlan(planId) {
        try {
            const response = await fetch(`/api/diet-plans/${planId}`);
            if (response.ok) {
                const plan = await response.json();
                this.showDietPlanDetails(plan);
            }
        } catch (error) {
            console.error('Error loading diet plan details:', error);
        }
    }

    showDietPlanDetails(plan) {
        // This would show a detailed view of the diet plan
        // For now, just show basic info
        this.showMessage(`${plan.name}: ${plan.description}`, 'info');
    }

    // Profile
    async loadProfile() {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const profile = await response.json();
                this.populateProfileForm(profile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    populateProfileForm(profile) {
        document.getElementById('profile-first-name').value = profile.first_name || '';
        document.getElementById('profile-last-name').value = profile.last_name || '';
        document.getElementById('profile-email').value = profile.email || '';
        document.getElementById('profile-birth-date').value = profile.birth_date || '';
        document.getElementById('profile-height').value = profile.height || '';
        document.getElementById('profile-weight').value = profile.weight || '';
        document.getElementById('profile-activity-level').value = profile.activity_level || '';
        document.getElementById('profile-goal').value = profile.goal || '';
        document.getElementById('profile-target-weight').value = profile.target_weight || '';
    }

    async updateProfile(formData) {
        try {
            this.showLoading(true);
            
            const profileData = {
                height: formData.get('profile-height'),
                weight: formData.get('profile-weight'),
                activityLevel: formData.get('profile-activity-level'),
                goal: formData.get('profile-goal'),
                targetWeight: formData.get('profile-target-weight')
            };

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                this.showMessage('Profil uğurla yeniləndi', 'success');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Profil yenilənərkən xəta baş verdi', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showMessage('Profil yenilənərkən xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Authentication forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.login(formData.get('login-username'), formData.get('login-password'));
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.register({
                username: formData.get('register-username'),
                email: formData.get('register-email'),
                password: formData.get('register-password'),
                firstName: formData.get('register-first-name'),
                lastName: formData.get('register-last-name'),
                birthDate: formData.get('register-birth-date'),
                gender: formData.get('register-gender'),
                height: formData.get('register-height'),
                weight: formData.get('register-weight'),
                activityLevel: formData.get('register-activity-level'),
                goal: formData.get('register-goal'),
                targetWeight: formData.get('register-target-weight')
            });
        });

        // Meal form
        document.getElementById('add-meal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMeal(new FormData(e.target));
        });

        // Progress form
        document.getElementById('add-progress-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitProgress(new FormData(e.target));
        });

        // Profile form
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile(new FormData(e.target));
        });

        // Food search
        document.getElementById('food-search').addEventListener('input', 
            this.debounce(() => this.searchFoods(), 300));
        
        document.getElementById('food-category').addEventListener('change', () => this.searchFoods());

        // Date filters
        document.getElementById('meal-date-filter').addEventListener('change', () => this.loadMeals());

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tabName}-form`).classList.add('active');
            });
        });
    }

    setupModals() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for HTML onclick handlers
window.showPage = (page) => app.showPage(page);
window.showAddMealModal = () => app.showAddMealModal();
window.showAddProgressModal = () => app.showModal('add-progress-modal');
window.closeModal = (modalId) => app.closeModal(modalId);
window.logout = () => app.logout();

// Initialize app
const app = new DietApp();
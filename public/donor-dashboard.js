document.addEventListener('DOMContentLoaded', function() {
    loadProjects();
    loadExpenditures();
});

async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        
        displayProjects(projects);
        updateProjectStats(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadExpenditures() {
    try {
        const response = await fetch('/api/expenditures');
        const expenditures = await response.json();
        
        displayExpenditures(expenditures);
        updateExpenditureStats(expenditures);
    } catch (error) {
        console.error('Error loading expenditures:', error);
    }
}

function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<p>No projects found.</p>';
        return;
    }
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-item">
            <h4>${project.name}</h4>
            <p>${project.description || 'No description'}</p>
            <span class="project-status status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
            <div style="margin-top: 10px;">
                <small>Created: ${new Date(project.created_at).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

function displayExpenditures(expenditures) {
    const expendituresList = document.getElementById('expendituresList');
    
    if (expenditures.length === 0) {
        expendituresList.innerHTML = '<p>No expenditures found.</p>';
        return;
    }
    
    // Group expenditures by project
    const groupedExpenditures = expenditures.reduce((acc, exp) => {
        if (!acc[exp.project_name]) {
            acc[exp.project_name] = [];
        }
        acc[exp.project_name].push(exp);
        return acc;
    }, {});
    
    expendituresList.innerHTML = Object.entries(groupedExpenditures).map(([projectName, exps]) => {
        const totalAmount = exps.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        
        return `
            <div class="project-expenditure-group">
                <h4 style="color: #0066cc; margin-bottom: 15px;">${projectName}</h4>
                <div style="margin-bottom: 10px; font-weight: bold;">Total: $${totalAmount.toFixed(2)}</div>
                ${exps.map(exp => `
                    <div class="expenditure-item">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${exp.category}</strong>
                                <p style="margin: 5px 0;">${exp.description || 'No description'}</p>
                                <small>Date: ${new Date(exp.date).toLocaleDateString()}</small>
                            </div>
                            <div class="expenditure-amount">$${parseFloat(exp.amount).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

function updateProjectStats(projects) {
    document.getElementById('totalProjects').textContent = projects.length;
}

function updateExpenditureStats(expenditures) {
    const totalExpenditure = expenditures.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    document.getElementById('totalExpenditure').textContent = `$${totalExpenditure.toFixed(2)}`;
}
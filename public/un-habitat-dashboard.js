document.addEventListener('DOMContentLoaded', function() {
    loadProjects();
    loadExpenditures();
    
    document.getElementById('projectForm').addEventListener('submit', addProject);
    document.getElementById('expenditureForm').addEventListener('submit', addExpenditure);
});

async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        
        displayProjects(projects);
        populateProjectSelect(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadExpenditures() {
    try {
        const response = await fetch('/api/expenditures');
        const expenditures = await response.json();
        
        displayExpenditures(expenditures);
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
                <button onclick="editProject(${project.id})" style="width: auto; margin-right: 10px;">Edit</button>
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
    
    expendituresList.innerHTML = expenditures.map(exp => `
        <div class="expenditure-item">
            <h4>${exp.project_name} - ${exp.category}</h4>
            <div class="expenditure-amount">$${parseFloat(exp.amount).toFixed(2)}</div>
            <p>${exp.description || 'No description'}</p>
            <small>Date: ${new Date(exp.date).toLocaleDateString()}</small>
        </div>
    `).join('');
}

function populateProjectSelect(projects) {
    const select = document.getElementById('expenditureProject');
    select.innerHTML = '<option value="">Select Project</option>' + 
        projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
}

async function addProject(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        status: document.getElementById('projectStatus').value
    };
    
    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
            document.getElementById('projectForm').reset();
            loadProjects();
        } else {
            alert('Failed to add project');
        }
    } catch (error) {
        console.error('Error adding project:', error);
        alert('Failed to add project');
    }
}

async function addExpenditure(e) {
    e.preventDefault();
    
    const expenditureData = {
        project_id: document.getElementById('expenditureProject').value,
        category: document.getElementById('expenditureCategory').value,
        amount: document.getElementById('expenditureAmount').value,
        description: document.getElementById('expenditureDescription').value,
        date: document.getElementById('expenditureDate').value
    };
    
    try {
        const response = await fetch('/api/expenditures', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expenditureData)
        });
        
        if (response.ok) {
            document.getElementById('expenditureForm').reset();
            loadExpenditures();
        } else {
            alert('Failed to add expenditure');
        }
    } catch (error) {
        console.error('Error adding expenditure:', error);
        alert('Failed to add expenditure');
    }
}

async function editProject(projectId) {
    // Simple implementation - in a real app, you'd have a proper edit form
    const newStatus = prompt('Enter new status (Planning, In Progress, Completed, On Hold):');
    if (!newStatus) return;
    
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadProjects();
        } else {
            alert('Failed to update project');
        }
    } catch (error) {
        console.error('Error updating project:', error);
        alert('Failed to update project');
    }
}
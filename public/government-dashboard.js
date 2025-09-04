document.addEventListener('DOMContentLoaded', function() {
    loadProjects();
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

function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<p>No projects found.</p>';
        return;
    }
    
    // Group projects by status
    const groupedProjects = projects.reduce((acc, project) => {
        if (!acc[project.status]) {
            acc[project.status] = [];
        }
        acc[project.status].push(project);
        return acc;
    }, {});
    
    projectsList.innerHTML = Object.entries(groupedProjects).map(([status, statusProjects]) => `
        <div class="status-group">
            <h4 style="color: #0066cc; margin-bottom: 15px; display: flex; align-items: center;">
                <span class="project-status status-${status.toLowerCase().replace(' ', '-')}" style="margin-right: 10px;">${status}</span>
                (${statusProjects.length} projects)
            </h4>
            ${statusProjects.map(project => `
                <div class="project-item">
                    <h4>${project.name}</h4>
                    <p>${project.description || 'No description'}</p>
                    <div style="margin-top: 10px;">
                        <small>Created: ${new Date(project.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function updateProjectStats(projects) {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'In Progress').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('activeProjects').textContent = activeProjects;
    document.getElementById('completedProjects').textContent = completedProjects;
}
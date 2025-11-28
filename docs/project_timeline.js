// project_timeline.js
document.addEventListener('DOMContentLoaded', function() {
    // Map of stage IDs to their display names and icons
    const STAGE_CONFIG = {
        'etapa2': {
            title: 'Estudos',
            description: 'Análise de viabilidade e estudos técnicos',
            icon: 'fa-file-alt',
            order: 1
        },
        'etapa5': {
            title: 'Consulta Pública',
            description: 'Audiências e consultas públicas',
            icon: 'fa-comments',
            order: 2
        },
        'etapa8': {
            title: 'TCU',
            description: 'Análise do Tribunal de Contas da União',
            icon: 'fa-balance-scale',
            order: 3
        },
        'etapa9': {
            title: 'Edital',
            description: 'Publicação do edital de licitação',
            icon: 'fa-file-contract',
            order: 4
        },
        'etapa13': {
            title: 'Leilão',
            description: 'Processo de licitação',
            icon: 'fa-gavel',
            order: 5
        },
        'etapa14': {
            title: 'Assinatura do Contrato',
            description: 'Assinatura do contrato de concessão',
            icon: 'fa-file-signature',
            order: 6
        }
    };
    
    // Default order of stages
    const STAGE_ORDER = ['etapa2', 'etapa5', 'etapa8', 'etapa9', 'etapa13', 'etapa14'];
    
    // Sort function to maintain stage order
    const sortStages = (a, b) => {
        return (STAGE_CONFIG[a]?.order || 99) - (STAGE_CONFIG[b]?.order || 99);
    };

    // Function to check if a stage is completed
    function isStageCompleted(status) {
        if (!status) return false;
        const completedStatuses = ['completed', 'concluido', 'concluído', 'finalizado'];
        return completedStatuses.some(s => status.toLowerCase().includes(s.toLowerCase()));
    }

    // Function to generate timeline steps HTML with status indicators
    function getTimelineSteps(project) {
        if (!project || !project.timeline) return '';
        
        // Create a map of stage IDs to their status
        const stageStatus = {};
        project.timeline.forEach(item => {
            stageStatus[item.milestone] = item.status || 'pending';
        });
        
        // Get stages in the correct order
        const stages = Object.keys(STAGE_CONFIG).sort(sortStages);
        
        let html = `
        <style>
            .timeline-container {
                margin: 20px 0;
                position: relative;
                padding: 20px 0;
            }
            .timeline {
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                margin-bottom: 40px;
            }
            .timeline::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 2px;
                background: #e0e0e0;
                z-index: 1;
            }
            .timeline-item {
                text-align: center;
                position: relative;
                z-index: 2;
                flex: 1;
                max-width: 150px;
            }
            .timeline-bullet {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                margin: 0 auto 8px;
                border: 2px solid #3b82f6;
                background: white;
                position: relative;
                z-index: 2;
            }
            .timeline-bullet.completed {
                background: #3b82f6;
            }
            .timeline-bullet.in-progress {
                background: linear-gradient(135deg, #3b82f6 50%, white 50%);
            }
            .timeline-label {
                font-size: 12px;
                color: #4b5563;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .timeline-details {
                margin-top: 30px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
            }
            .stage-detail {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e5e7eb;
            }
            .stage-detail:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .stage-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 5px;
            }
            .stage-status {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-left: 8px;
            }
            .status-completed {
                background-color: #d1fae5;
                color: #065f46;
            }
            .status-pending, .status-not-started {
                background-color: #e5e7eb;
                color: #4b5563;
            }
            .status-in-progress {
                background-color: #dbeafe;
                color: #1e40af;
            }
        </style>
        <div class="timeline-container">
            <div class="timeline">
                ${stages.map(stageId => {
                    const stage = STAGE_CONFIG[stageId];
                    const status = stageStatus[stageId] || 'not started';
                    const isCompleted = isStageCompleted(status);
                    const isInProgress = status.toLowerCase().includes('progress') || status.toLowerCase().includes('andamento');
                    
                    let bulletClass = '';
                    if (isCompleted) {
                        bulletClass = 'completed';
                    } else if (isInProgress) {
                        bulletClass = 'in-progress';
                    }
                    
                    return `
                    <div class="timeline-item">
                        <div class="timeline-bullet ${bulletClass}" title="${stage.title}: ${status}"></div>
                        <div class="timeline-label">${stage.title}</div>
                    </div>`;
                }).join('')}
            </div>
            
            <div class="timeline-details">
                ${stages.map(stageId => {
                    const stage = STAGE_CONFIG[stageId];
                    const status = stageStatus[stageId] || 'Not started';
                    const statusClass = isStageCompleted(status) ? 'completed' : 
                                      status.toLowerCase().includes('progress') ? 'in-progress' : 'pending';
                    const date = project.timeline.find(t => t.milestone === stageId)?.date || '';
                    
                    return `
                    <div class="stage-detail">
                        <div class="stage-title">
                            ${stage.title}
                            <span class="stage-status status-${statusClass}">
                                ${status}
                            </span>
                        </div>
                        ${date ? `<div class="text-sm text-gray-600">${formatDate(date)}</div>` : ''}
                        <div class="text-sm text-gray-700 mt-1">${stage.description}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
        
        return html;
    }

    // Function to create and show the timeline modal
    function showTimelineModal(project) {
        // Close any existing modal
        const existingModal = document.getElementById('timelineModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'timelineModal';
        
        // Modal content
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <!-- Modal header -->
                <div class="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
                    <h3 class="text-xl font-bold text-gray-800">Linha do Tempo - ${project.name}</h3>
                    <button class="text-gray-500 hover:text-gray-700 close-timeline">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Timeline content -->
                <div class="p-6">
                    <div class="relative">
                        ${getTimelineSteps(project)}
                    </div>
                </div>
                
                <!-- Modal footer -->
                <div class="p-4 border-t flex justify-end">
                    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors close-timeline">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for close buttons
        modal.querySelectorAll('.close-timeline').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
    }

    // Function to generate timeline steps HTML
    function getTimelineSteps(project) {
        // Get all stage IDs that exist in the project details
        const projectStages = project.details ? Object.keys(project.details)
            .filter(key => key.startsWith('etapa'))
            .sort(sortStages) : [];

        // If no stages found in project.details, use default stages
        const stagesToShow = projectStages.length > 0 ? projectStages : STAGE_ORDER;

        return stagesToShow.map(stageId => {
            const stageConfig = STAGE_CONFIG[stageId] || {
                title: stageId,
                description: 'Informação não disponível',
                icon: 'fa-question-circle'
            };
            
            const stageData = project.details?.[stageId] || {};
            const status = stageData.status || 'Not Available';
            const isCompleted = status === 'Completed' || status === 'Concluído' || status === 'Concluido' || status === 'Concluída';
            const isCurrent = status === 'Em andamento' || status === 'Em Andamento' || status === 'Em andamento';
            const isNotStarted = status === 'Not Available' || status === 'Não Iniciado' || status === 'Não iniciado';
            const statusText = getStatusText(status);
            
            return `
                <div class="timeline-step">
                    <!-- Timeline dot -->
                    <div class="timeline-dot ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}">
                        <i class="fas ${stageConfig.icon}"></i>
                    </div>
                    
                    <!-- Step content -->
                    <div class="bg-white p-4 rounded-lg border ${isCompleted ? 'border-green-200' : isCurrent ? 'border-yellow-200' : 'border-gray-200'} shadow-sm mb-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-lg text-gray-800">${stageConfig.title}</h4>
                                <p class="text-gray-600 mb-2">${stageConfig.description}</p>
                            </div>
                            <span class="px-2 py-1 text-xs rounded-full ${isCompleted ? 'bg-green-100 text-green-800' : isCurrent ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
                                ${getStatusText(status)}
                            </span>
                        </div>
                        
                        ${stageData.lastUpdated ? `
                            <div class="mt-2 text-sm text-gray-500">
                                <i class="far fa-clock mr-1"></i>
                                Atualizado em: ${formatDate(stageData.lastUpdated)}
                            </div>
                        ` : ''}
                        
                        ${stageData.observacoes ? `
                            <div class="mt-2 p-2 bg-blue-50 text-sm text-blue-700 rounded">
                                <i class="fas fa-info-circle mr-1"></i>
                                ${stageData.observacoes}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        });
    }
    
    // Helper function to format status text
    function getStatusText(status) {
        if (!status) return 'Não Iniciado';
        
        const statusMap = {
            'concluido': 'Concluído',
            'concluída': 'Concluído',
            'concluido': 'Concluído',
            'em andamento': 'Em Andamento',
            'em execução': 'Em Andamento',
            'andamento': 'Em Andamento',
            'não iniciado': 'Não Iniciado',
            'não disponível': 'Não Disponível',
            'not available': 'Não Disponível',
            'atrasado': 'Atrasado',
            'cancelado': 'Cancelado',
            'suspenso': 'Suspenso',
            'em análise': 'Em Análise',
            'em licitação': 'Em Licitação',
            'licitado': 'Licitado',
            'contratado': 'Contratado',
            'em implantação': 'Em Implantação',
            'implantado': 'Implantado',
            'paralisado': 'Paralisado',
            'em revisão': 'Em Revisão'
        };
        
        // Check for exact matches first (case insensitive)
        const lowerStatus = status.toLowerCase().trim();
        for (const [key, value] of Object.entries(statusMap)) {
            if (lowerStatus === key.toLowerCase()) {
                return value;
            }
        }
        
        // Check for partial matches if no exact match found
        for (const [key, value] of Object.entries(statusMap)) {
            if (lowerStatus.includes(key.toLowerCase())) {
                return value;
            }
        }
        
        // Default to original status if no match found
        return status;
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return 'Data não disponível';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return dateString; // Return original string if date parsing fails
        }
    }

    // Function to initialize timeline buttons
    function initTimelineButtons() {
        // Add click handler to all project cards
        document.addEventListener('click', function(e) {
            const card = e.target.closest('.project-card');
            if (!card) return;
            
            const projectId = card.dataset.id;
            const project = window.projectData?.find(p => p.id === projectId);
            if (project) {
                e.preventDefault();
                e.stopPropagation();
                showTimelineModal(project);
            }
        });

        // Add click handler to timeline buttons
        document.addEventListener('click', function(e) {
            const timelineBtn = e.target.closest('.open-timeline');
            if (!timelineBtn) return;
            
            const projectId = timelineBtn.dataset.projectId || timelineBtn.closest('[data-id]')?.dataset.id;
            if (!projectId) return;
            
            const project = window.projectData?.find(p => p.id === projectId);
            if (project) {
                e.preventDefault();
                e.stopPropagation();
                showTimelineModal(project);
            }
        });
    }

    // Initialize the timeline buttons when the page loads
    initTimelineButtons();

    // Make the showTimelineModal function available globally
    window.showTimelineModal = showTimelineModal;

    // Add the timeline modal styles
    if (!document.getElementById('timeline-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'timeline-styles';
        styleElement.textContent = `
            .timeline-step {
                position: relative;
                padding-left: 3rem;
                margin-bottom: 1rem;
            }

            .timeline-step:not(:last-child)::after {
                content: '';
                position: absolute;
                left: 1.5rem;
                top: 2.5rem;
                bottom: -1rem;
                width: 2px;
                background-color: #e5e7eb;
            }

            .timeline-dot {
                position: absolute;
                left: 0.5rem;
                top: 0.25rem;
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.75rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                z-index: 10;
                transition: all 0.3s ease;
            }

            .timeline-dot.completed {
                background-color: #10b981;
            }

            .timeline-dot.current {
                background-color: #f59e0b;
                animation: pulse 2s infinite;
            }

            .timeline-dot.pending {
                background-color: #9ca3af;
            }

            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
            }

            /* Responsive adjustments */
            @media (max-width: 640px) {
                .timeline-step {
                    padding-left: 2.5rem;
                }
                
                .timeline-dot {
                    width: 1.75rem;
                    height: 1.75rem;
                    left: 0.25rem;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showTimelineModal: window.showTimelineModal };
}

const fs = require('fs');
let c = fs.readFileSync('src/services/apiService.ts', 'utf8');
const start = c.indexOf('export const mockTemplates');
const end = c.indexOf('export const mockTasks');
const newT = `export const mockTemplates: TaskTemplate[] = [
  {
    id: 'TM001',
    name: 'Analisis Kebutuhan',
    category: 'Development',
    description: 'Tahap pengumpulan dan analisis requirement sistem.',
    priority: 'High',
    estimatedHours: 16,
    slaDays: 3,
    assignmentType: 'manual',
    checklist: [
      { id: 'c1', text: 'Wawancara stakeholder', completed: false },
      { id: 'c2', text: 'Dokumentasi BRD', completed: false },
      { id: 'c3', text: 'Review Kebutuhan Sistem', completed: false }
    ],
    customFields: [], automationRules: []
  },
  {
    id: 'TM002',
    name: 'Desain UI/UX',
    category: 'Development',
    description: 'Pembuatan wireframe dan prototipe UI.',
    priority: 'High',
    estimatedHours: 24,
    slaDays: 4,
    assignmentType: 'manual',
    checklist: [
      { id: 'c1', text: 'Pembuatan Wireframe', completed: false },
      { id: 'c2', text: 'Desain High-Fidelity', completed: false },
      { id: 'c3', text: 'Prototyping interaktif', completed: false }
    ],
    customFields: [], automationRules: []
  },
  {
    id: 'TM003',
    name: 'Pengembangan Backend',
    category: 'Development',
    description: 'Pembuatan API, database, dan logika sistem belakang.',
    priority: 'High',
    estimatedHours: 40,
    slaDays: 7,
    assignmentType: 'manual',
    checklist: [
      { id: 'c1', text: 'Setup Database', completed: false },
      { id: 'c2', text: 'Pembuatan endpoint API', completed: false },
      { id: 'c3', text: 'Unit testing API', completed: false }
    ],
    customFields: [], automationRules: []
  },
  {
    id: 'TM004',
    name: 'Pengembangan Frontend',
    category: 'Development',
    description: 'Implementasi UI ke dalam kode frontend.',
    priority: 'High',
    estimatedHours: 40,
    slaDays: 7,
    assignmentType: 'manual',
    checklist: [
      { id: 'c1', text: 'Setup framework', completed: false },
      { id: 'c2', text: 'Slicing UI', completed: false },
      { id: 'c3', text: 'Integrasi API', completed: false }
    ],
    customFields: [], automationRules: []
  },
  {
    id: 'TM005',
    name: 'Testing',
    category: 'Development',
    description: 'Pengujian kualitas dan pencarian bug.',
    priority: 'High',
    estimatedHours: 16,
    slaDays: 3,
    assignmentType: 'manual',
    checklist: [
      { id: 'c1', text: 'SIT (System Integration Testing)', completed: false },
      { id: 'c2', text: 'UAT (User Acceptance Testing)', completed: false },
      { id: 'c3', text: 'Pelaporan Bug', completed: false }
    ],
    customFields: [], automationRules: []
  },
  {
    id: 'TM006',
    name: 'Deployment',
    category: 'Maintenance',
    description: 'Proses rilis ke environment produksi.',
    priority: 'High',
    estimatedHours: 8,
    slaDays: 1,
    assignmentType: 'manual',
    checklist: [
      { id: 'c1', text: 'Backup Database Production', completed: false },
      { id: 'c2', text: 'Deploy Artifact', completed: false },
      { id: 'c3', text: 'Smoke Testing Production', completed: false }
    ],
    customFields: [], automationRules: []
  }
];`;
fs.writeFileSync('src/services/apiService.ts', c.slice(0, start) + newT + '\n\n' + c.slice(end));
console.log('updated mockTemplates');

import { portfolio } from './portfolio.js'

// Adapter for the original project-gallery subsystem.
export default portfolio.projects.map(project => ({
    title: project.title,
    titleSmall: project.title.split(' '),
    url: project.url || '/resume/#project-' + project.id,
    attributes: { role: 'Software engineering' },
    distinctions: [],
    images: []
}))

import { portfolio } from './portfolio.js'

// Existing offshore anchorages provide safe access to portfolio content.
export const portfolioStops = [
    { id: 'home', label: 'About Vaibhav', anchor: 'anchorage', x: -2, z: 18, menu: 'home' },
    { id: 'pdfretype', label: 'PDF Retype', anchor: 'pdfretype', x: -45, z: 32, modal: 'pdfretype' },
    { id: 'kms', label: 'Keep Me Stable', anchor: 'citadel', x: 48, z: 35, modal: 'kms' },
    { id: 'hive', label: 'Hive', anchor: 'treasureAtoll', x: 36, z: -56, modal: 'hive' },
    { id: 'smartbus360', label: 'SmartBus360', anchor: 'eastBarrier', x: 52, z: -22, modal: 'smartbus360' },
    { id: 'trustvault', label: 'TrustVault', anchor: 'swReef', x: -53, z: -22, modal: 'trustvault' },
    { id: 'skysea', label: 'SkySea Holidays', anchor: 'dangerReef', x: 0, z: 82, modal: 'skysea' },
    { id: 'skills', label: 'Skills & tools', anchor: 'southSandSpit', x: -20, z: -60, menu: 'skills' },
    { id: 'experience', label: 'Experience & education', anchor: 'ghostGalleon', x: -76, z: 56, menu: 'experience' },
    { id: 'achievements', label: 'Credentials', anchor: 'ancientRuins', x: 36, z: 62, menu: 'achievements' },
    { id: 'contact', label: 'Contact', anchor: 'easternDeep', x: 73, z: 6, menu: 'contact' },
].filter(stop => !stop.modal || portfolio.projects.some(project => project.id === stop.modal))

export const firstProjectStop = portfolioStops.find(stop => stop.modal)

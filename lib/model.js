/**
 * @copyright Philip Brown 2018
 * @author Philip Brown
 * @module Model
 */

/**
 * Mapping of common VX-Prime messages and what they should be renamed as.
 * --'each' is used to generate arrays of objects for obscure results
 */
module.exports = {
    'studio_list': {name: 'studioList', each: ['studioId','studioName']},
    'server_id': {name: 'serverId'},
    'server_version': {name: 'serverVersion'},
    'server_caps': {name: 'serverCapabilites'},
    'lwcp_version': {name: 'lwcpVersion'},
    'id': {name: 'studioId'},
    'name': {name: 'studioName'},
    'show_id':{name: 'showId'},
    'show_name': {name: 'showName'},
    'num_lines':{name:'numberOfLines'},
    'hybrid_list':{name: 'hybridList'},
    'num_hybrids':{name: 'numberOfHybrids'},
    'num_hyb_fixed':{name: 'numberOfFixedHybrids'},
    'pnext': {name: 'producerNext'},
    'busy_all':{name: 'allBusy'},
    'mute': {name: 'muted'},
    'show_locked': {name: 'showLocked'},
    'auto_answer':{name: 'autoAnswerOn'},
    'show_list':{name: 'showList', each:['showId','showName']},
    'line_list': {name: 'lineList', each: ['state','callstate','name','local','remote','hybrid','time','comment','direction']},
    'caller_id': {name: 'callerId'},
    'list': {name: 'list', each: ['id','name','number']}
}
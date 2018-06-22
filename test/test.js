const lwcp = require('../lib/lwcp'),
    assert = require('assert');

describe('Testing different results on a basic "server info" response', () => {
    
    it('Should return the basic structure of the response without conversion', () => {
        var response = 'indi studio id=1, name="Studio name", show_id=1, show_name="Show 1", num_lines=12, hybrid_list=["Fixed 1", "Fixed 2", "Fixed 3", "Fixed 4", "S1-Selectable 1", "S1-Selectable 2", "Selectable 6", "Selectable 7"], num_hybrids=8, num_hyb_fixed=4, next=0, pnext=0, busy_all=FALSE, mute=FALSE, show_locked=FALSE, auto_answer=FALSE';
        var expectedResult = {
            op: 'indi',
            obj: 'studio',
            props: {
                id: 1,
                name:"Studio name",
                show_id: 1,
                show_name: "Show 1",
                num_lines: 12,
                hybrid_list: ["Fixed 1", "Fixed 2", "Fixed 3", "Fixed 4", "S1-Selectable 1", "S1-Selectable 2", "Selectable 6", "Selectable 7"],
                num_hybrids: 8,
                num_hyb_fixed: 4,
                next: 0,
                pnext: 0,
                busy_all: false,
                mute: false,
                show_locked: false,
                auto_answer: false
            }
        }
        var parsed = lwcp.parse(response);
        assertEquality(parsed, expectedResult);
    })

    it('Should return the basic structure of the response with auto conversion', () => {
        var response = 'indi studio id=1, name="Studio name", show_id=1, show_name="Show 1", num_lines=12, hybrid_list=["Fixed 1", "Fixed 2", "Fixed 3", "Fixed 4", "S1-Selectable 1", "S1-Selectable 2", "Selectable 6", "Selectable 7"], num_hybrids=8, num_hyb_fixed=4, next=0, pnext=0, busy_all=FALSE, mute=FALSE, show_locked=FALSE, auto_answer=FALSE';
        var expectedResult = {
            op: 'indi',
            obj: 'studio',
            props: {
                studioId: 1,
                studioName: "Studio name",
                showId: 1,
                showName: "Show 1",
                numberOfLines: 12,
                hybridList: ["Fixed 1", "Fixed 2", "Fixed 3", "Fixed 4", "S1-Selectable 1", "S1-Selectable 2", "Selectable 6", "Selectable 7"],
                numberOfHybrids: 8,
                numberOfFixedHybrids: 4,
                next: 0,
                producerNext: 0,
                allBusy: false,
                muted: false,
                showLocked: false,
                autoAnswerOn: false
            }
        }
        var parsed = lwcp.parse(response, true);
        assertEquality(parsed, expectedResult);
    })

    it('Should return the basic structure of the response with a custom conversion model', () => {
        var response = 'indi studio id=1, name="Studio name", show_id=1, show_name="Show 1", num_lines=12, hybrid_list=["Fixed 1", "Fixed 2", "Fixed 3", "Fixed 4", "S1-Selectable 1", "S1-Selectable 2", "Selectable 6", "Selectable 7"], num_hybrids=8, num_hyb_fixed=4, next=0, pnext=0, busy_all=FALSE, mute=FALSE, show_locked=FALSE, auto_answer=FALSE';
        var customModel = {
            id: {name: 'studioIdentifier'},
            num_lines: {name: 'availableLines'}
        }
        var expectedResult = {
            op: 'indi',
            obj: 'studio',
            props: {
                studioIdentifier: 1,
                studioName: "Studio name",
                showId: 1,
                showName: "Show 1",
                availableLines: 12,
                hybridList: ["Fixed 1", "Fixed 2", "Fixed 3", "Fixed 4", "S1-Selectable 1", "S1-Selectable 2", "Selectable 6", "Selectable 7"],
                numberOfHybrids: 8,
                numberOfFixedHybrids: 4,
                next: 0,
                producerNext: 0,
                allBusy: false,
                muted: false,
                showLocked: false,
                autoAnswerOn: false
            }
        }
        var parsed = lwcp.parse(response);
        parsed = lwcp.convert(parsed, customModel);
        assertEquality(parsed, expectedResult);
    })

})

describe('Testing different results on a basic "line_list" response with 2 lines', () => {
    
    it('Should return the basic structure of the response without conversion', () => {
        var response = 'indi studio line_list=[[IDLE, IDLE, "Main-Studio", "10", NULL, 0, NULL, "", NONE], [IDLE, IDLE, "Main-Studio", "10", NULL, 0, NULL, "", NONE]]';
        var expectedResult = {
            op: 'indi',
            obj: 'studio',
            props: {
                line_list: [
                    ["IDLE", "IDLE", "Main-Studio", "10", null, 0, null, "", "NONE"],
                    ["IDLE", "IDLE", "Main-Studio", "10", null, 0, null, "", "NONE"]
                ]
            }
        }
        var parsed = lwcp.parse(response);
        assertEquality(parsed, expectedResult);
    })

    it('Should return the basic structure of the response with auto conversion', () => {
        var response = 'indi studio line_list=[[IDLE, IDLE, "Main-Studio", "10", NULL, 0, NULL, "", NONE], [IDLE, IDLE, "Main-Studio", "10", NULL, 0, NULL, "", NONE]]';
        var expectedResult = {
            op: 'indi',
            obj: 'studio',
            props: {
                lineList: [
                    {
                        'state': "IDLE",
                        'callstate': "IDLE",
                        'name': "Main-Studio",
                        'local': "10",
                        'remote': null,
                        'hybrid': 0,
                        'time': null,
                        'comment': "",
                        'direction': "NONE"
                    },
                    {
                        'state': "IDLE",
                        'callstate': "IDLE",
                        'name': "Main-Studio",
                        'local': "10",
                        'remote': null,
                        'hybrid': 0,
                        'time': null,
                        'comment': "",
                        'direction': "NONE"
                    }
                ]
            }
        }
        var parsed = lwcp.parse(response, true);
        assertEquality(parsed, expectedResult);
    })

    it('Should return the basic structure of the response with a custom conversion model', () => {
        var response = 'indi studio line_list=[[IDLE, IDLE, "Main-Studio", "10", NULL, 0, NULL, "", NONE], [IDLE, IDLE, "Main-Studio", "10", NULL, 0, NULL, "", NONE]]';
        var customModel = {
            line_list: {
                name: "listOfLines",
                each: ['lineState','lineCallstate','lineName','lineLocal','lineRemote','lineHybrid','lineTime','lineComment','lineDirection']
            }
        }
        var expectedResult = {
            op: 'indi',
            obj: 'studio',
            props: {
                listOfLines: [
                    {
                        'lineState': "IDLE",
                        'lineCallstate': "IDLE",
                        'lineName': "Main-Studio",
                        'lineLocal': "10",
                        'lineRemote': null,
                        'lineHybrid': 0,
                        'lineTime': null,
                        'lineComment': "",
                        'lineDirection': "NONE"
                    },
                    {
                        'lineState': "IDLE",
                        'lineCallstate': "IDLE",
                        'lineName': "Main-Studio",
                        'lineLocal': "10",
                        'lineRemote': null,
                        'lineHybrid': 0,
                        'lineTime': null,
                        'lineComment': "",
                        'lineDirection': "NONE"
                    }
                ]
            }
        }
        var parsed = lwcp.parse(response);
        parsed = lwcp.convert(parsed, customModel);
        assertEquality(parsed, expectedResult);
    })

})

function assertEquality(parsed, expected){
    for(var key in expected){
        if(key !== 'props')
            assert.equal(parsed[key], expected[key], `Could not match expected result for property "${key}"`);
        else
            assert.deepStrictEqual(parsed[key], expected[key], `Could not match expected result for property "${key}"`);
    }
}
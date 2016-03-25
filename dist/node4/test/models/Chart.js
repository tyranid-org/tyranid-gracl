"use strict";

const tyranid_1 = require('tyranid');
exports.ChartBaseCollection = new tyranid_1.default.Collection({
    id: 'c00',
    name: 'chart',
    dbName: 'charts',
    fields: {
        _id: { is: 'mongoid' },
        name: { is: 'string' },
        organizationId: {
            link: 'organization'
        },
        blogId: {
            link: 'blog'
        },
        postIds: {
            is: 'array', of: { link: 'post' }
        },
        teamIds: {
            is: 'array', of: { link: 'team' }
        },
        userIds: {
            is: 'array', of: { link: 'user' }
        }
    }
});
class Chart extends exports.ChartBaseCollection {}
exports.Chart = Chart;
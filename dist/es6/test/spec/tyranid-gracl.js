"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Tyr = require('tyranid');
const tpmongo = require('tpmongo');
const chai_1 = require('chai');
const _1 = require('../../lib/');
const expectedLinkPaths_1 = require('./expectedLinkPaths');
const createTestData_1 = require('./createTestData');
const db = tpmongo('mongodb://127.0.0.1:27017/tyranid_gracl_test', []), root = __dirname.replace(/test\/spec/, '');
const secure = _1.PermissionsModel.getGraclPlugin();
describe('tyranid-gracl', () => {
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            secure.verbose = true;
            Tyr.config({
                db: db,
                validate: [
                    { dir: root + '/test/models', fileMatch: '[a-z].js' },
                    { dir: root + '/lib/models', fileMatch: '[a-z].js' }
                ],
                secure: secure
            });
            yield createTestData_1.createTestData();
        });
    });
    it('Cached link paths should be correctly constructed', () => {
        for (const a in expectedLinkPaths_1.expectedLinkPaths) {
            for (const b in expectedLinkPaths_1.expectedLinkPaths[a]) {
                chai_1.expect(secure.getShortestPath(Tyr.byName[a], Tyr.byName[b]), `Path from ${a} to ${b}`)
                    .to.deep.equal(expectedLinkPaths_1.expectedLinkPaths[a][b] || []);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlyYW5pZC1ncmFjbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3Qvc3BlYy90eXJhbmlkLWdyYWNsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUdBLE1BQVksR0FBRyxXQUFNLFNBQVMsQ0FBQyxDQUFBO0FBQy9CLE1BQVksT0FBTyxXQUFNLFNBQVMsQ0FBQyxDQUFBO0FBQ25DLHVCQUF1QixNQUFNLENBQUMsQ0FBQTtBQUM5QixtQkFBaUMsWUFBWSxDQUFDLENBQUE7QUFDOUMsb0NBQWtDLHFCQUFxQixDQUFDLENBQUE7QUFDeEQsaUNBQStCLGtCQUFrQixDQUFDLENBQUE7QUFFbEQsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLDhDQUE4QyxFQUFFLEVBQUUsQ0FBQyxFQUNoRSxJQUFJLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFakQsTUFBTSxNQUFNLEdBQUcsbUJBQWdCLENBQUMsY0FBYyxFQUFFLENBQUM7QUFFakQsUUFBUSxDQUFDLGVBQWUsRUFBRTtJQUV4QixNQUFNLENBQUM7O1lBQ0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVwQixNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUV0QixHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUNULEVBQUUsRUFBRSxFQUFFO2dCQUNOLFFBQVEsRUFBRTtvQkFDUixFQUFFLEdBQUcsRUFBRSxJQUFJLEdBQUcsY0FBYyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUU7b0JBQ3JELEVBQUUsR0FBRyxFQUFFLElBQUksR0FBRyxhQUFhLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRTtpQkFDckQ7Z0JBQ0QsTUFBTSxFQUFFLE1BQU07YUFDZixDQUFDLENBQUM7WUFFSCxNQUFNLCtCQUFjLEVBQUUsQ0FBQztRQUN6QixDQUFDO0tBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1EQUFtRCxFQUFFO1FBQ3RELEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLHFDQUFpQixDQUFDLENBQUMsQ0FBQztZQUNsQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLGFBQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3FCQUNuRixFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQ0FBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBR0wsQ0FBQyxDQUFDLENBQUMifQ==
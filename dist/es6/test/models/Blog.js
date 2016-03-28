"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const tyranid_1 = require('tyranid');
const Post_1 = require('./Post');
exports.BlogBaseCollection = new tyranid_1.default.Collection({
    id: 'b00',
    name: 'blog',
    dbName: 'blogs',
    fields: {
        _id: { is: 'mongoid' },
        name: { is: 'string' },
        organizationId: {
            link: 'organization',
            relate: 'ownedBy',
            graclType: 'resource'
        },
        graclResourcePermissionIds: { is: 'array', link: 'graclPermission' }
    }
});
class Blog extends exports.BlogBaseCollection {
    static addPost(text, blog) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = new Post_1.Post({ text: text, blogId: blog['_id'] });
            yield post.$save();
            return post;
        });
    }
}
exports.Blog = Blog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmxvZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvbW9kZWxzL0Jsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMEJBQWdCLFNBQVMsQ0FBQyxDQUFBO0FBQzFCLHVCQUFxQixRQUFRLENBQUMsQ0FBQTtBQUVqQiwwQkFBa0IsR0FBRyxJQUFJLGlCQUFHLENBQUMsVUFBVSxDQUFDO0lBQ25ELEVBQUUsRUFBRSxLQUFLO0lBQ1QsSUFBSSxFQUFFLE1BQU07SUFDWixNQUFNLEVBQUUsT0FBTztJQUNmLE1BQU0sRUFBRTtRQUNOLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUU7UUFDdEIsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRTtRQUN0QixjQUFjLEVBQUU7WUFDZCxJQUFJLEVBQUUsY0FBYztZQUNwQixNQUFNLEVBQUUsU0FBUztZQUNqQixTQUFTLEVBQUUsVUFBVTtTQUN0QjtRQUNELDBCQUEwQixFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7S0FDckU7Q0FDRixDQUFDLENBQUM7QUFFSCxtQkFBb0QsMEJBQW1CO0lBQ3JFLE9BQWEsT0FBTyxDQUFDLElBQVksRUFBRSxJQUFrQjs7WUFDbkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQUMsRUFBRSxNQUFBLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyRCxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztLQUFBO0FBQ0gsQ0FBQztBQU5ZLFlBQUksT0FNaEIsQ0FBQSJ9
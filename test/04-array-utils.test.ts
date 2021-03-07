import { JsonDB } from '../src/JsonDB'
import * as fs from 'fs'

describe('Array Utils', () => {
    const db = new JsonDB('test/recipe', true, true)
    describe('get number of item in an array', () => {
        test('should have the correct count of an array', () => {
            const recipe_1 = {id: 65464646155, name: "Cheesecake", category: "Dessert"};
            const recipe_2 = {id: 78687873783, name: "Cheeseburger", category: "Dish"};
            const recipe_3 = {id: 12335373873, name: "Soup", category: "Starter"};
            db.push("/recipes[0]", recipe_1, true);
            db.push("/recipes[1]", recipe_2, true);
            db.push("/recipes[2]", recipe_3, true);

            expect(db.count("/recipes")).toBe(3);
        })

    })
    describe('get index of item in an array', () => {
        test('should get the index of the current value', () => {
            const recipe_1 = {id: "65464646155", name: "Cheesecake", category: "Dessert"};
            const recipe_2 = {id: "78687873783", name: "Gratin", category: "Dish"};
            const recipe_3 = {id: "12335373873", name: "Soupe", category: "Starter"};
            db.push("/recipes[0]", recipe_1, true);
            db.push("/recipes[1]", recipe_2, true);
            db.push("/recipes[2]", recipe_3, true);

            expect(db.getIndex("/recipes", "65464646155")).toBe(0);
            expect(db.getIndex("/recipes", "78687873783")).toBe(1);
            expect(db.getIndex("/recipes", "12335373873")).toBe(2);

            db.delete("/recipes[" + db.getIndex("/recipes", "78687873783") + "]");

            expect(db.getIndex("/recipes", "65464646155")).toBe(0);
            expect(db.getIndex("/recipes", "12335373873")).toBe(1);
        })
        
        test('should get the index of the current value with anything but id', () => {
            const recipe_1 = {test: "65464646155", name: "Cheesecake", category: "Dessert"};
            const recipe_2 = {test: "78687873783", name: "Gratin", category: "Dish"};
            const recipe_3 = {test: "12335373873", name: "Soupe", category: "Starter"};
            db.push("/recipes[0]", recipe_1, true);
            db.push("/recipes[1]", recipe_2, true);
            db.push("/recipes[2]", recipe_3, true);

            expect(db.getIndex("/recipes", "65464646155", "test")).toBe(0);
            expect(db.getIndex("/recipes", "78687873783", "test")).toBe(1);
            expect(db.getIndex("/recipes", "12335373873", "test")).toBe(2);
        })
        test('should get the index of the current value with anything but numerical', () => {
            const recipe_1 = {test: 65464646155, name: "Cheesecake", category: "Dessert"};
            const recipe_2 = {test: 78687873783, name: "Gratin", category: "Dish"};
            const recipe_3 = {test: 12335373873, name: "Soupe", category: "Starter"};
            db.push("/recipes[0]", recipe_1, true);
            db.push("/recipes[1]", recipe_2, true);
            db.push("/recipes[2]", recipe_3, true);

            expect(db.getIndex("/recipes", 65464646155, "test")).toBe(0);
            expect(db.getIndex("/recipes", 78687873783, "test")).toBe(1);
            expect(db.getIndex("/recipes", 12335373873, "test")).toBe(2);
        })

    })
    describe('Cleanup', () => {
        test('should remove the test files', () => {
            fs.unlinkSync("test/recipe.json")
        })
    })
})
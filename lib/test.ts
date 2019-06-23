import * as ts from 'typescript';
import gotaTransformer from "./index"
/*
 if( handler.service.isServiceMappingForAsynchronousMethod(node)){
                handler.service.injectAwaitedType(node);
                return node;
            }else if(true){
                handler.model.getFields(node);
                return node
            }else
                return ts.visitEachChild(node, (child) => visit(child), context);
            }
*/
/*
let source = `

@Service('x-foo')
class MyClass {
  @ServiceMapping({method:'POST', path : 'path_string'})
  public testFunction:Promise<String>(){

  };

  @baz
  public b: number;
}

`;

User = __decorate([
        Entity([{ name: 'name', type: String }, { name: 'birthday', type: Date }])
    ], User);

*/
let source = `


@Entity([{name:'name', type: String},{name: 'birthday', type: Date}])
export class User extends Model {
    name:String;
    email:String;
    phone:String;
    birthday: Date;
    address: Address;
    gender: Boolean;
    weight: Number;
    height: Number;
    @DynamicAccess(DynamicAccessMode.READ)
    createDate: Date;
    @DynamicAccess(DynamicAccessMode.READ)
    active: Boolean;
    constructor(name:String, email:String, phone:String, birthday: Date, address: Address, gender: Boolean, weight: Number, height: Number){
        super({name, email, phone, birthday, address, gender, weight, height});
        this.createDate = new Date();
        this.active = false;
    }
 }

`;



let result = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.ES2015, experimentalDecorators: true},
    transformers: {before: [gotaTransformer()]}
});
console.log(result.outputText)


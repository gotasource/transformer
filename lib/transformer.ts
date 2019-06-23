import * as ts from 'typescript';
import {Decorator, PropertyDeclaration, SyntaxKind} from "typescript";
import {ArrayLiteralExpression} from "typescript";

const SERVICE_MAPPING_DECORATOR_STRING = 'ServiceMapping';
const ENTITY_DECORATOR_STRING = 'Entity';

let handler = {
    service:{
        isServiceMappingForAsynchronousMethod(node){
            if(this.getServiceMappingDecorator(node) && this.getAwaitedTypeName(node)){
                return true;
            }else{
                return false;
            }
        },
        getServiceMappingDecorator(node){
            if (ts.isPropertyDeclaration(node) && node.decorators && node.name) {
                const serviceMappingDecorator = node.decorators.find((decorator) => {
                    const decoratorExpr = decorator.expression;
                    return ts.isCallExpression(decoratorExpr) &&
                        decoratorExpr.expression.getText()+'' === SERVICE_MAPPING_DECORATOR_STRING;
                });
                return serviceMappingDecorator;
            }
            return null;
        },
        getAwaitedTypeName(node){
            if(node.type && node.type.typeArguments && node.type.typeArguments.length>0){
                return node.type.typeArguments[0].typeName.getText();
            }
            return null;
        },
        injectAwaitedType(node){
            let serviceMappingDecorator = this.getServiceMappingDecorator(node);
            let awaitedTypeName = this.getAwaitedTypeName(node);
            // serviceMappingDecorator.expression['arguments'][0].properties.push( ts.createPropertyAssignment('awaitedType', ts.createLiteral(awaitedTypeName)));
            serviceMappingDecorator.expression['arguments'][0].properties.push(ts.createPropertyAssignment('awaitedType', ts.createIdentifier(awaitedTypeName)));
        }
    },
    model:{
        isModel(node){
            return !! this.getEntityDecorator(node);
        },
        getEntityDecorator(node){
            if(ts.isClassDeclaration(node) && node.decorators && node.name){
                const decorator = node.decorators.find((decorator) => {
                    const decoratorExpr = decorator.expression;
                    return ts.isCallExpression(decoratorExpr) &&
                        decoratorExpr.expression.getText()+'' === ENTITY_DECORATOR_STRING;
                });
                return decorator;
            }
            return null;
        },
        getProperties(node){
            return node.members.filter(property =>{
                if(ts.isPropertyDeclaration(property)){
                    return !property.modifiers ||
                        (property.modifiers.some(modifier => SyntaxKind.PublicKeyword === modifier.kind) && property.modifiers.every(modifier => SyntaxKind.StaticKeyword !== modifier.kind));
                }
                return false;
            }).map(property => {
                let name = property.name.getText();
                let type =property.type.typeName.getText();
                return {name, type};
            })
        },
        injectProperties(node){
            let properties = this.getProperties(node);
            let entityDecorator = this.getEntityDecorator(node);

            let elements = properties.map(property =>{
                let members = [ts.createPropertyAssignment('name', ts.createLiteral(property.name)), ts.createPropertyAssignment('type', ts.createIdentifier(property.type))];
                let objectLiteral = ts.createObjectLiteral(members);
                return objectLiteral;
            })

            let _arguments = ts.createArrayLiteral(elements);
            entityDecorator.expression['arguments'][0] = _arguments;
        }
    }


}

export default function <T extends ts.Node>(): ts.TransformerFactory<T> {
    return (context) => {
        const visit: ts.Visitor = (node) => {
            if( handler.service.isServiceMappingForAsynchronousMethod(node) ){
                handler.service.injectAwaitedType(node);
                return node;
            }else if(handler.model.isModel(node)){
                handler.model.injectProperties(node);
                return node
            }else {
                return ts.visitEachChild(node, (child) => visit(child), context);
            }
        };

        return (node) => ts.visitNode(node, visit);
    };
}

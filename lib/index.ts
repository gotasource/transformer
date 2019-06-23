import * as ts from 'typescript';
import transformer from "./transformer"

export default function <T extends ts.Node>(): ts.TransformerFactory<T> {
    return transformer();
}

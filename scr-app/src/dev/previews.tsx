import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import Pastebin from "../containers/Pastebin";

const ComponentPreviews = (props) => {
    console.log("CCC", props);
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/Pastebin">
                <Pastebin/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;

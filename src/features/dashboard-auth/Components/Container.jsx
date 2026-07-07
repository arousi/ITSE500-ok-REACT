import "../components-style.css"
export default function Container({children}) {

    return (
        <div id={"container"}>
           {children}
        </div>
    );
}
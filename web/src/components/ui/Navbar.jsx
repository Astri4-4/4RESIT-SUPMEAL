
const variants = {
    "dashboard": "bg-green"
}

export default function Navbar({page, children, ...props}) {

    return (
        <div className={"w-screen bg-green" + variants[page]} >

            <div className={"w-[170px] h-screen"} >

            </div>

            {children}
        </div>
    )

}
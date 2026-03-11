export default function Dashboard(){

  return(

    <div className="grid grid-cols-3 gap-6">

      <div className="card p-6">

        <h3 className="text-gray-500">
          Total Items
        </h3>

        <p className="text-3xl font-semibold mt-2">
          120
        </p>

      </div>

      <div className="card p-6">

        <h3 className="text-gray-500">
          Low Stock
        </h3>

        <p className="text-3xl font-semibold mt-2 text-red-500">
          8
        </p>

      </div>

      <div className="card p-6">

        <h3 className="text-gray-500">
          Expired Items
        </h3>

        <p className="text-3xl font-semibold mt-2 text-yellow-500">
          3
        </p>

      </div>

    </div>

  )

}
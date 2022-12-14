import { FC } from "react";
import Account from "./account";
import BroswerList from "./broswer-list";

interface Prop {
  address: string
}

const Dashboard: FC<Prop> = ({ address }) => {

  return (
    <div className="w-full pl-4 pr-4">
      <Account address={address} />
      <BroswerList />
    </div>
  )
}

export default Dashboard;
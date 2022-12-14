import { FC, useEffect, useState } from "react";
import browser from "webextension-polyfill";
import * as U from '../../util'

const BroswerList: FC = () => {

  const [scoreList, setScoreList] = useState<U.ScoreList>([])
  useEffect(() => {
    browser.storage.local.get(['score_list']).then(({ score_list }) => {
      if (score_list) {
        setScoreList(score_list)
      }
    })
  }, [])
  return (
    <div className="w-full pl-4 pr-4 mb-10">
      <div
        className="text-white text-lg font-light font-medium italic mb-2"
        onClick={() => { }}
      >Your unupdated data is below:</div>
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <div className="text-white text-lg italic font-medium">Ranking</div>
          <div className="text-white text-lg italic font-medium">Categories</div>
          <div className="text-white text-lg italic font-medium">Score</div>
        </div>
        {
          scoreList.map((item, index) => (
            <div className="flex justify-between items-center mb-4">
              <div className="text-white text-base italic">{index + 1}</div>
              <div className="text-white text-base italic">{item.name}</div>
              <div className="text-white text-base italic">{item.score}</div>
            </div>
          ))
        }
      </div>
      {
        scoreList.length
        &&
        <div className="flex justify-center items-center">
          <div
            className="bg-blue-900 text-white border-full font-medium text-base rounded py-2 px-6 hover:bg-blue-800 cursor-pointer"
            onClick={async () => {
              let { score_list, address } = await browser.storage.local.get(['score_list', 'address'])
              if (!address) {
                alert('Please connect wallet')
                U.Helper.goWeb(U.WEP_URL)
                return;
              }

              let r = await U.Helper.apiCall({ method: 'GET', URI: `/score/check/${address}` })
              const obj: any = {}
              if (r.length) {
                score_list.forEach((v: any) => {
                  obj[v.name] = Number(r[0][v.name]) + Number(v.score)
                });
                obj['address'] = address

                await U.Helper.apiCall({ method: 'POST', URI: '/score/update', params: { ...obj } })
                U.Helper.goWeb(U.WEP_URL)
                browser.storage.local.remove('score_list')
              } else {
                obj['address'] = address
                score_list.forEach((v: any) => {
                  obj[v.name] = Number(v.score)
                });
                await U.Helper.apiCall({ method: 'POST', URI: '/score/add', params: { ...obj } })
                browser.storage.local.remove('score_list')

                U.Helper.goWeb(U.WEP_URL)
              }
            }}
          >Go Web to update</div>
        </div>
      }

    </div>
  )
}

export default BroswerList;
import Base from '../components/base';
import * as U from '../utils'
import Home from '../components/home';

export default function Index() {

  return (
      <Base
        tdk={{ title: U.DEFAULT_TITLE, description: U.DEFAULT_DESCRIPTION, keywords: U.DEFAULT_KEYWORDS }}
      >
        <Home />
      </Base>
  )
}


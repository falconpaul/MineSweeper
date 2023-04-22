import { connect, ConnectedProps } from 'react-redux'
import { AppDispatch, RootState } from '../store'

const App: React.FC<Props> = ({  }) => {

  return (
    <>
      <div>Content</div>
    </>
  )
}

const mapState = (state: RootState) => {
  return {
  }
}

const mapDispatch = (dispatch: AppDispatch) => {
  return {
  }
}

const connector = connect(mapState, mapDispatch)

type Props = ConnectedProps<typeof connector>

export default connector(App)

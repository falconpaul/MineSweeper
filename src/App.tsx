import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import './assets/styles/global.scss'
import { AppDispatch, RootState } from './store'
import { selectIsSmileClicked, selectSmileType, setIsSmileClicked, setSmileType, SmileType, CellType, openCell, selectFrontField, onSmileClick, markCell, selectMinesCount, updateTimer, selectTimerSeconds, selectTimerStarted, selectIsGameOver } from './store/field/field'

const App: React.FC<Props> = ({
  smileType,
  isSmileClicked,
  frontfield,
  minesCount,
  timerSeconds,
  timerStarted,
  isGameOver,
  setSmileType,
  setIsSmileClicked,
  onSmileClick,
  openCell,
  markCell,
  updateTimer
}) => {
  useEffect(() => {
    if (timerStarted && !isGameOver) {
      const t = setInterval(updateTimer, 1000)
      return () => clearInterval(t)
    }
  }, [timerStarted, isGameOver])

  const panelMouseDown = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      setIsSmileClicked(false)
      setSmileType(SmileType.shoked)
    }
  }
  const panelMouseUp = (e: React.MouseEvent) => {
    if (e.buttons === 0) {
      setIsSmileClicked(false)
      setSmileType(SmileType.default)
    }
  }
  const smileMouseDown = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      e.stopPropagation()
      setIsSmileClicked(true)
      setSmileType(SmileType.pressed)
    }
  }
  const smileMouseUp = (e: React.MouseEvent) => {
    if (e.buttons === 0) {
      onSmileClick()
    }
  }
  const smileMouseLeave = () => {
    if (isSmileClicked) {
      setSmileType(SmileType.default)
    }
  }
  const smileMouseEnter = () => {
    if (isSmileClicked) {
      setSmileType(SmileType.pressed)
    }
  }

  const minesCountStr = String(minesCount).padStart(3, '0')
  const timerSecondsStr = String(timerSeconds).padStart(3, '0')

  return (
    <>
      <div
        className="panel"
        onMouseDown={panelMouseDown}
        onMouseUp={panelMouseUp}
        onContextMenu={(e) => { e.preventDefault() }}
      >
        <div className="controls">
          <div className="mines">
            <div className={'digit digit-' + minesCountStr[0]} />
            <div className={'digit digit-' + minesCountStr[1]} />
            <div className={'digit digit-' + minesCountStr[2]} />
          </div>
          <div
            className={`smile smile-${smileType}`}
            onMouseDown={smileMouseDown}
            onMouseLeave={smileMouseLeave}
            onMouseEnter={smileMouseEnter}
            onMouseUp={smileMouseUp}
          /> 
          <div className="timer">
            <div className={'digit digit-' + timerSecondsStr[0]} />
            <div className={'digit digit-' + timerSecondsStr[1]} />
            <div className={'digit digit-' + timerSecondsStr[2]} />
          </div>
        </div>
        <div className="field">
          {frontfield.map((row: CellType[], i: number) => (
            <div key={i} className="row">
              {row.map((v: CellType, j: number) => (
                <div
                  className={'cell cell-' + v} key={j}
                  onClick={() => { openCell([i, j]) }}
                  onContextMenu={() => { markCell([i, j]) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const mapState = (state: RootState) => {
  return {
    smileType: selectSmileType(state),
    isSmileClicked: selectIsSmileClicked(state),
    frontfield: selectFrontField(state),
    minesCount: selectMinesCount(state),
    timerSeconds: selectTimerSeconds(state),
    timerStarted: selectTimerStarted(state),
    isGameOver: selectIsGameOver(state)
  }
}

const mapDispatch = (dispatch: AppDispatch) => {
  return {
    setSmileType: (value: SmileType) => dispatch(setSmileType(value)),
    setIsSmileClicked: (value: boolean) => dispatch(setIsSmileClicked(value)),
    onSmileClick: () => dispatch(onSmileClick()),
    openCell: (value: number[]) => dispatch(openCell(value)),
    markCell: (value: number[]) => dispatch(markCell(value)),
    updateTimer: () => dispatch(updateTimer())
  }
}

const connector = connect(mapState, mapDispatch)

type Props = ConnectedProps<typeof connector>

export default connector(App)

import { useState, useEffect, useRef } from 'react'
import './App.css'
import { seCorrect, seWrong } from './se'

// 問題データ型
interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number[]; // 正解の選択肢index（複数選択対応）
  explanation: string;
  multi: boolean; // 複数選択かどうか
}

const questions: Question[] = [
  {
    id: 1,
    text: 'AIの定義として最も適切なものはどれか。',
    options: [
      '人間の知能を模倣するシステム',
      '人間の感情を持つロボット',
      '人間の身体能力を超える機械',
      '人間の脳を完全に再現した装置'
    ],
    correct: [0],
    explanation: 'AI（人工知能）は「人間の知能を模倣するシステム」と定義されることが多いです。',
    multi: false,
  },
  {
    id: 2,
    text: '機械学習の特徴として正しいものをすべて選べ。',
    options: [
      'データからパターンを学習する',
      '明示的なプログラムなしで学習する',
      '常に正しい結果を出す',
      '経験に基づいて性能が向上する'
    ],
    correct: [0,1,3],
    explanation: '機械学習はデータからパターンを学び、経験により性能が向上します。',
    multi: true,
  },
  {
    id: 3,
    text: 'ディープラーニングでよく使われるネットワーク構造はどれか。',
    options: [
      '畳み込みニューラルネットワーク',
      '決定木',
      'サポートベクターマシン',
      'k平均法'
    ],
    correct: [0],
    explanation: 'ディープラーニングでは畳み込みニューラルネットワーク（CNN）がよく使われます。',
    multi: false,
  },
  {
    id: 4,
    text: '教師あり学習の例として正しいものをすべて選べ。',
    options: [
      '画像分類',
      'クラスタリング',
      '回帰分析',
      '主成分分析'
    ],
    correct: [0,2],
    explanation: '画像分類や回帰分析は教師あり学習の代表例です。',
    multi: true,
  },
  {
    id: 5,
    text: '強化学習の特徴として誤っているものはどれか。',
    options: [
      'エージェントが環境と相互作用する',
      '報酬に基づいて学習する',
      '正解ラベル付きデータが必要',
      '試行錯誤を通じて最適化する'
    ],
    correct: [2],
    explanation: '強化学習は正解ラベル付きデータを必要としません。',
    multi: false,
  },
  {
    id: 6,
    text: 'ディープラーニングの学習に多く使われる最適化手法はどれか。',
    options: [
      '勾配降下法',
      '線形回帰',
      '主成分分析',
      '決定木'
    ],
    correct: [0],
    explanation: 'ディープラーニングの学習では勾配降下法がよく使われます。',
    multi: false,
  },
  {
    id: 7,
    text: 'AI倫理に関する問題として正しいものをすべて選べ。',
    options: [
      'バイアス',
      '説明可能性',
      'データのプライバシー',
      'AIの感情表現'
    ],
    correct: [0,1,2],
    explanation: 'バイアス、説明可能性、プライバシーはAI倫理の重要な課題です。',
    multi: true,
  },
  {
    id: 8,
    text: '「過学習」とはどのような現象か。',
    options: [
      '訓練データに対してのみ高い精度を示す',
      '新しいデータにも高い精度を示す',
      'モデルが単純すぎる',
      'データが不足している'
    ],
    correct: [0],
    explanation: '過学習は訓練データに対してのみ高い精度を示し、汎化性能が低下する現象です。',
    multi: false,
  },
  {
    id: 9,
    text: 'AIの社会実装における課題として正しいものをすべて選べ。',
    options: [
      '説明責任',
      '公平性',
      '透明性',
      '計算機の消費電力'
    ],
    correct: [0,1,2],
    explanation: '説明責任、公平性、透明性はAI社会実装の重要な課題です。',
    multi: true,
  },
  {
    id: 10,
    text: '「ブラックボックス問題」とは何か。',
    options: [
      'AIの判断根拠が分かりにくい',
      'AIが自律的に学習する',
      'AIが人間を超える',
      'AIが感情を持つ'
    ],
    correct: [0],
    explanation: 'ブラックボックス問題はAIの判断根拠が分かりにくいことを指します。',
    multi: false,
  },
]

// 終了後のフィードバック用関数
function getFeedback(score: number, total: number) {
  const rate = score / total
  if (rate === 1) return 'パーフェクト！この調子で本番も余裕っしょ！'
  if (rate >= 0.8) return '合格圏内！あと少しだけ復習すればバッチリ！'
  if (rate >= 0.6) return '惜しい！苦手分野を重点的に復習しよ！'
  return 'まだ伸びしろしかない！今からでも全然間に合うから一緒に頑張ろ！'
}

// localStorage保存・読込用
function saveQuestionsToStorage(questions: Question[]) {
  localStorage.setItem('my_questions', JSON.stringify(questions))
}
function loadQuestionsFromStorage(): Question[] | null {
  const data = localStorage.getItem('my_questions')
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

function App() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0) // 正解数
  const [finished, setFinished] = useState(false) // 全問終了
  const [timeLeft, setTimeLeft] = useState(300) // 5分(秒)
  const [timeout, setTimeoutFlag] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef(false)

  // タイマー開始（1問目表示時のみ）
  useEffect(() => {
    if (!startedRef.current && current === 0 && !finished) {
      startedRef.current = true
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimeoutFlag(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    if (finished || timeout) {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (finished || timeout) {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [current, finished, timeout])

  // 問題データの初期化
  const [myQuestions, setMyQuestions] = useState<Question[]>(() => {
    const loaded = loadQuestionsFromStorage()
    return loaded ?? questions
  })

  const q = myQuestions[current]
  const total = myQuestions.length
  const progress = ((current + (answered || finished ? 1 : 0)) / total) * 100

  const handleSelect = (idx: number) => {
    if (answered) return
    if (q.multi) {
      setSelected((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      )
    } else {
      setSelected([idx])
    }
  }

  const playSE = (type: 'correct' | 'wrong') => {
    const audio = new Audio(type === 'correct' ? seCorrect : seWrong)
    audio.volume = 0.5
    audio.play()
  }

  const handleSubmit = () => {
    if (answered) return
    const correct =
      selected.length === q.correct.length &&
      selected.every((v) => q.correct.includes(v))
    setIsCorrect(correct)
    setAnswered(true)
    if (correct) setScore((prev) => prev + 1)
    playSE(correct ? 'correct' : 'wrong')
  }

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1)
      setSelected([])
      setAnswered(false)
      setIsCorrect(false)
    } else {
      setFinished(true)
    }
  }

  // 問題追加フォーム用state
  const [showAdd, setShowAdd] = useState(false)
  const [newQ, setNewQ] = useState({
    text: '',
    options: ['', '', '', ''],
    correct: [] as number[],
    explanation: '',
    multi: false,
  })

  // 編集・削除用state
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editQ, setEditQ] = useState({
    text: '',
    options: ['', '', '', ''],
    correct: [] as number[],
    explanation: '',
    multi: false,
  })

  // 問題追加処理
  const handleAddQuestion = () => {
    if (!newQ.text.trim() || newQ.options.some(o => !o.trim()) || newQ.correct.length === 0 || !newQ.explanation.trim()) return
    const next: Question = {
      id: myQuestions.length + 1,
      text: newQ.text,
      options: [...newQ.options],
      correct: [...newQ.correct],
      explanation: newQ.explanation,
      multi: newQ.multi,
    }
    const updated = [...myQuestions, next]
    setMyQuestions(updated)
    saveQuestionsToStorage(updated)
    setNewQ({ text: '', options: ['', '', '', ''], correct: [], explanation: '', multi: false })
    setShowAdd(false)
  }

  // 編集開始
  const handleEditStart = (idx: number) => {
    setEditIdx(idx)
    setEditQ({
      text: myQuestions[idx].text,
      options: [...myQuestions[idx].options],
      correct: [...myQuestions[idx].correct],
      explanation: myQuestions[idx].explanation,
      multi: myQuestions[idx].multi,
    })
  }
  // 編集保存
  const handleEditSave = () => {
    if (!editQ.text.trim() || editQ.options.some(o => !o.trim()) || editQ.correct.length === 0 || !editQ.explanation.trim() || editIdx === null) return
    const updated = myQuestions.map((q, i) => i === editIdx ? {
      ...q,
      text: editQ.text,
      options: [...editQ.options],
      correct: [...editQ.correct],
      explanation: editQ.explanation,
      multi: editQ.multi,
    } : q)
    setMyQuestions(updated)
    saveQuestionsToStorage(updated)
    setEditIdx(null)
  }
  // 削除
  const handleDelete = (idx: number) => {
    if (!window.confirm('本当に削除する？')) return
    const updated = myQuestions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, id: i + 1 }))
    setMyQuestions(updated)
    saveQuestionsToStorage(updated)
    if (current >= updated.length) setCurrent(0)
  }

  if (finished) {
    return (
      <div className="container">
        <div className="progress-bar-wrapper">
          <div className="progress-bar" style={{ width: '100%' }} />
          <span className="progress-label">{questions.length} / {questions.length}</span>
        </div>
        <h2>模擬試験 結果</h2>
        <p>あなたの正解数: <b>{score} / {questions.length}</b></p>
        <p style={{fontWeight:'bold',color:'#0078d4',fontSize:'1.2em'}}>{getFeedback(score, questions.length)}</p>
        <p>お疲れさまでした！</p>
        <button onClick={() => { setCurrent(0); setFinished(false); setScore(0); setAnswered(false); setIsCorrect(false); setSelected([]); }}>もう一度解く</button>
        <button onClick={() => setShowAdd(true)} style={{marginLeft:8}}>問題を追加する</button>
      </div>
    )
  }
  if (timeout) {
    return (
      <div className="container">
        <div className="progress-bar-wrapper">
          <div className="progress-bar" style={{ width: '100%' }} />
          <span className="progress-label">{questions.length} / {questions.length}</span>
        </div>
        <h2>時間切れ</h2>
        <p>試験時間（5分）が経過しました。お疲れさまでした。</p>
        <p>あなたの正解数: <b>{score} / {questions.length}</b></p>
        <p style={{fontWeight:'bold',color:'#0078d4',fontSize:'1.2em'}}>{getFeedback(score, questions.length)}</p>
        <button onClick={() => setShowAdd(true)}>問題を追加する</button>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="progress-bar-wrapper">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
        <span className="progress-label">{current + 1} / {total}</span>
      </div>
      <div className="timer" style={{position:'absolute',top:24,left:24,fontWeight:'bold',fontSize:'1.1em'}}>
        残り時間: {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
      </div>
      <h2>模擬試験</h2>
      <div className="question">
        <p style={{ fontWeight: 'bold' }}>問題 {current + 1} / {total}</p>
        <p>{q.text}</p>
        <ul>
          {q.options.map((opt, idx) => (
            <li key={idx}>
              <label style={{
                fontWeight: answered && q.correct.includes(idx) ? 'bold' : 'normal',
                color: answered
                  ? q.correct.includes(idx)
                    ? 'green'
                    : selected.includes(idx)
                    ? 'red'
                    : 'inherit'
                  : 'inherit',
              }}>
                <input
                  type={q.multi ? 'checkbox' : 'radio'}
                  name="option"
                  checked={selected.includes(idx)}
                  disabled={answered}
                  onChange={() => handleSelect(idx)}
                />
                {opt}
              </label>
            </li>
          ))}
        </ul>
        {!answered ? (
          <button onClick={handleSubmit} disabled={selected.length === 0}>
            回答する
          </button>
        ) : (
          <div className="result">
            <p style={{ color: isCorrect ? 'green' : 'red' }}>
              {isCorrect ? '正解です！' : '不正解です'}
            </p>
            <p>解説: {q.explanation}</p>
            <button onClick={handleNext}>
              {current < questions.length - 1 ? '次の問題へ' : '結果を見る'}
            </button>
          </div>
        )}
      </div>
      <button onClick={() => setShowAdd(true)} style={{marginBottom:12}}>問題を追加する</button>
      {/* 問題の編集・削除機能 */}
      {showAdd && (
        <div className="add-modal">
          <div className="add-modal-inner">
            <h3>{editIdx !== null ? '問題を編集' : '新しい問題を追加'}</h3>
            <label>問題文<br /><textarea value={editIdx !== null ? editQ.text : newQ.text} onChange={e => (editIdx !== null ? setEditQ(q => ({ ...q, text: e.target.value })) : setNewQ(q => ({ ...q, text: e.target.value })))} rows={2} style={{width:'100%'}} /></label>
            <br />
            {(editIdx !== null ? editQ.options : newQ.options).map((opt, i) => (
              <label key={i}>選択肢{i+1}<br />
                <input value={opt} onChange={e => {
                  if (editIdx !== null) {
                    setEditQ(q => { const opts = [...q.options]; opts[i] = e.target.value; return { ...q, options: opts } })
                  } else {
                    setNewQ(q => { const opts = [...q.options]; opts[i] = e.target.value; return { ...q, options: opts } })
                  }
                }} style={{width:'100%'}} />
              </label>
            ))}
            <br />
            <label>正解（複数可）<br />
              {(editIdx !== null ? editQ.options : newQ.options).map((_, i) => (
                <span key={i} style={{marginRight:8}}>
                  <input type={(editIdx !== null ? editQ.multi : newQ.multi) ? 'checkbox' : 'radio'} name="edit-correct" checked={(editIdx !== null ? editQ.correct : newQ.correct).includes(i)} onChange={() => {
                    if (editIdx !== null) {
                      setEditQ(q => {
                        if (editQ.multi) {
                          return { ...q, correct: q.correct.includes(i) ? q.correct.filter(x => x !== i) : [...q.correct, i] }
                        } else {
                          return { ...q, correct: [i] }
                        }
                      })
                    } else {
                      setNewQ(q => {
                        if (newQ.multi) {
                          return { ...q, correct: q.correct.includes(i) ? q.correct.filter(x => x !== i) : [...q.correct, i] }
                        } else {
                          return { ...q, correct: [i] }
                        }
                      })
                    }
                  }} /> {String.fromCharCode(65+i)}
                </span>
              ))}
            </label>
            <br />
            <label>
              <input type="checkbox" checked={editIdx !== null ? editQ.multi : newQ.multi} onChange={e => (editIdx !== null ? setEditQ(q => ({ ...q, multi: e.target.checked, correct: [] })) : setNewQ(q => ({ ...q, multi: e.target.checked, correct: [] })))} /> 複数選択問題にする
            </label>
            <br />
            <label>解説<br /><textarea value={editIdx !== null ? editQ.explanation : newQ.explanation} onChange={e => (editIdx !== null ? setEditQ(q => ({ ...q, explanation: e.target.value })) : setNewQ(q => ({ ...q, explanation: e.target.value })))} rows={2} style={{width:'100%'}} /></label>
            <br />
            {editIdx !== null ? (
              <>
                <button onClick={handleEditSave} style={{marginRight:8}}>保存</button>
                <button onClick={() => setEditIdx(null)}>キャンセル</button>
              </>
            ) : (
              <>
                <button onClick={handleAddQuestion} style={{marginRight:8}}>追加する</button>
                <button onClick={() => setShowAdd(false)}>キャンセル</button>
              </>
            )}
          </div>
        </div>
      )}
      {/* 問題リスト（編集・削除ボタン） */}
      <div style={{margin:'16px 0',textAlign:'left'}}>
        <h4>登録済みの問題</h4>
        <ul style={{paddingLeft:0}}>
          {myQuestions.map((q, i) => (
            <li key={q.id} style={{marginBottom:4}}>
              <span style={{fontWeight:'bold'}}>{q.text.slice(0, 18)}{q.text.length > 18 ? '…' : ''}</span>
              <button style={{marginLeft:8}} onClick={() => handleEditStart(i)}>編集</button>
              <button style={{marginLeft:4}} onClick={() => handleDelete(i)}>削除</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App

import type { InteractiveListItem } from './mock.js'

export async function sendText(_waPhone: string, _text: string) {
  throw new Error('WATI real adapter not implemented')
}

export async function sendInteractiveList(
  _waPhone: string,
  _header: string,
  _body: string,
  _items: InteractiveListItem[],
) {
  throw new Error('WATI real interactive list not implemented')
}

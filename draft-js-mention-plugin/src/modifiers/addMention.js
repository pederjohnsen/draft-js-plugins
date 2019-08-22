import { Modifier, EditorState } from 'draft-js';
import getSearchText from '../utils/getSearchText';
import getTypeByTrigger from '../utils/getTypeByTrigger';

// This modifier can insert mention to current cursor position (with replace selected fragment),
// or replace mention suggestion like "@name". Behavior determined by `Mode` parameter.
const Mode = {
  INSERT: 'INSERT', // insert mention to current cursor position
  REPLACE: 'REPLACE', // replace mention suggestion
};

const addMention = (
  editorState,
  mention,
  mentionPrefix,
  mentionTrigger,
  entityMutability,
  mode = Mode.INSERT
) => {
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(
    getTypeByTrigger(mentionTrigger),
    entityMutability,
    { mention }
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

  const currentSelectionState = editorState.getSelection();

  let mentionReplacedContent;
  let mentionEndPos = 0;
  let blockSize = 0;

  switch (mode) {
    case Mode.INSERT: {
      // in case text is selected it is removed and then the mention is added
      const afterRemovalContentState = Modifier.removeRange(
        contentState,
        currentSelectionState,
        'backward'
      );

      // deciding on the position to insert mention
      const targetSelection = afterRemovalContentState.getSelectionAfter();

      mentionReplacedContent = Modifier.replaceText(
        afterRemovalContentState,
        targetSelection,
        `${mentionPrefix}${mention.name}`,
        null, // no inline style needed
        entityKey
      );

      mentionEndPos = targetSelection.getAnchorOffset();
      const blockKey = targetSelection.getAnchorKey();
      blockSize = contentState.getBlockForKey(blockKey).getLength();

      break;
    }

    case Mode.REPLACE: {
      const { begin, end } = getSearchText(
        editorState,
        currentSelectionState,
        mentionTrigger
      );

      // get selection of the @mention search text
      const mentionTextSelection = currentSelectionState.merge({
        anchorOffset: begin,
        focusOffset: end,
      });

      mentionReplacedContent = Modifier.replaceText(
        editorState.getCurrentContent(),
        mentionTextSelection,
        `${mentionPrefix}${mention.name}`,
        null, // no inline style needed
        entityKey
      );

      mentionEndPos = end;
      const blockKey = mentionTextSelection.getAnchorKey();
      blockSize = contentState.getBlockForKey(blockKey).getLength();

      break;
    }

    default:
      throw new Error('Unidentified value of "mode"');
  }

  // If the mention is inserted at the end, a space is appended right after for
  // a smooth writing experience.
  if (blockSize === mentionEndPos) {
    mentionReplacedContent = Modifier.insertText(
      mentionReplacedContent,
      mentionReplacedContent.getSelectionAfter(),
      ' '
    );
  }

  const newEditorState = EditorState.push(
    editorState,
    mentionReplacedContent,
    'insert-mention'
  );
  return EditorState.forceSelection(
    newEditorState,
    mentionReplacedContent.getSelectionAfter()
  );
};

export default addMention;
export { Mode };

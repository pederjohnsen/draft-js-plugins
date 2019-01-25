/* @flow */

import findWithRegex from 'find-with-regex';

const EMOJI_REGEX = /(\s|^):[\w]*/g;

export default (contentBlock: Object, callback: Function) => {
  const testCallback = (one, two, three) => {
    console.log('##testCallback');
    console.log(one);
    console.log(two);
    console.log(three);
  };
  console.log('###findWithRegex');
  findWithRegex(EMOJI_REGEX, contentBlock, testCallback);
  findWithRegex(EMOJI_REGEX, contentBlock, callback);
};

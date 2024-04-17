import { serializeStyles } from '@emotion/serialize';
import { StyleSheet } from '@emotion/sheet';
import { serialize, compile, middleware, rulesheet, stringify } from 'stylis';

function injectGlobal(...args: any) {
  // @ts-ignore
  const { name, styles } = serializeStyles(...args);
  const sheet = new StyleSheet({
    key: `global-${name}`,
    container: document.head
  });
  const stylis = (styles: any) =>
    serialize(
      compile(styles),
      middleware([
        stringify,
        rulesheet((rule) => {
          sheet.insert(rule);
        })
      ])
    );
  stylis(styles);
  return () => sheet.flush();
}

export default injectGlobal;
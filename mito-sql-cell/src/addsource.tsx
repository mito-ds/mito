import { Option, Select } from '@jupyter/react-components';
import type { Dialog } from '@jupyterlab/apputils';
import { FormComponent, ReactWidget } from '@jupyterlab/ui-components';
import { find } from '@lumino/algorithm';
import { IChangeEvent } from '@rjsf/core';
import type { FormValidation } from '@rjsf/utils';
import validatorAjv8 from '@rjsf/validator-ajv8';
import React, { useCallback } from 'react';
import * as templates from './databases/templates.json';
import type { ISqlSource, ISqlSources } from './tokens';
import type { ReadonlyJSONObject } from '@lumino/coreutils';

/**
 * Map driver key to source type.
 */
export const DRIVER_TO_TYPE = Object.keys(templates).reduce(
  (agg, key) => {
    if ((templates as any)[key].schema) {
      agg[(templates as any)[key].schema.properties.driver.default] = key;
    }
    return agg;
  },
  {} as Record<string, string>
);

function SqlSourceForm(props: {
  /**
   * SQL sources.
   */
  sources: ISqlSources;
  /**
   * Form data change callback.
   */
  onChange: (e: IChangeEvent) => any;
}): JSX.Element {
  const [type, setType] = React.useState<string>('PostgreSQL');
  const customValidate = useCallback(
    (
      formData: ReadonlyJSONObject | undefined,
      errors: FormValidation<ReadonlyJSONObject>
    ) => {
      if (
        find(
          props.sources,
          source => source.connectionName === formData?.connectionName
        )
      ) {
        errors.connectionName?.addError(
          'A source with this name already exists.'
        );
      }
      return errors;
    },
    [props.sources]
  );
  const onTypeChange = useCallback((event: any) => {
    setType(event.target.value);
  }, []);
  return (
    <>
      <label>
        Source type:{' '}
        <Select onChange={onTypeChange} value={type}>
          {Object.keys(templates).map(key => (
            <Option key={key} value={key}>
              {key}
            </Option>
          ))}
        </Select>
      </label>
      <FormComponent
        customValidate={customValidate}
        formData={{}}
        onChange={props.onChange}
        schema={(templates as any)[type].schema as any}
        uiSchema={{
          driver: {
            'ui:disabled': true,
            'ui:readonly': true
          },
          password: {
            'ui:widget': 'password'
          }
        }}
        validator={validatorAjv8 as any}
      />
    </>
  );
}

/**
 * JupyterLab dialog body containing a form for adding a SQL source.
 */
export class AddSource
  extends ReactWidget
  implements Dialog.IBodyWidget<ISqlSource | null>
{
  protected source: ISqlSource | null = null;

  constructor(protected sources: ISqlSources) {
    super();
  }

  protected render(): JSX.Element {
    return <SqlSourceForm onChange={this._onChange} sources={this.sources} />;
  }

  /**
   * Returns the form data.
   */
  getValue(): ISqlSource | null {
    return this.source;
  }

  private _onChange = (e: IChangeEvent): void => {
    this.source = e.formData;
  };
}

import { Option, Select } from '@jupyter/react-components';
import type { Dialog } from '@jupyterlab/apputils';
import { FormComponent, ReactWidget } from '@jupyterlab/ui-components';
import { IChangeEvent } from '@rjsf/core';
import validatorAjv8 from '@rjsf/validator-ajv8';
import React, { useCallback } from 'react';
import * as templates from './databases/templates.json';
import type { ISqlSource } from './tokens';

export const DRIVER_TO_TYPE = Object.keys(templates).reduce(
  (agg, key) => {
    agg[(templates as any)[key].driver] = key;
    return agg;
  },
  {} as Record<string, string>
);

function SqlSourceForm(props: {
  /**
   * Form data change callback.
   */
  onChange: (e: IChangeEvent) => any;
}): JSX.Element {
  const [type, setType] = React.useState<string>('PostgreSQL');
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
        formData={{}}
        onChange={props.onChange}
        schema={(templates as any)[type].schema as any}
        uiSchema={{
          driver: {
            'ui:disabled': true,
            'ui:readonly': true,
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

export class AddSource
  extends ReactWidget
  implements Dialog.IBodyWidget<ISqlSource | null>
{
  protected source: ISqlSource | null = null;

  protected render(): JSX.Element {
    return <SqlSourceForm onChange={this._onChange} />;
  }

  getValue(): ISqlSource | null {
    return this.source;
  }

  private _onChange = (e: IChangeEvent): void => {
    this.source = e.formData;
  };
}

import { useEffect, useState } from 'react';
import {
  getModelField,
  getModelMetadata,
} from '../services/modelService';
import type {
  ModelField,
  ModelMetadata,
  ScalarVariable,
} from '../services/modelService';

export function useOceanModel() {
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [variable, setVariable] = useState<ScalarVariable>('thetao');
  const [timeIndex, setTimeIndex] = useState(0);
  const [depth, setDepth] = useState<number | null>(null);

  const [scalarField, setScalarField] = useState<ModelField | null>(null);
  const [uField, setUField] = useState<ModelField | null>(null);
  const [vField, setVField] = useState<ModelField | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------
  // 1. Load metadata ONCE on mount
  // ------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      try {
        const result = await getModelMetadata(controller.signal);
        setMetadata(result);

        if (result.depths && result.depths.length > 0) {
          setDepth(Number(result.depths[0]));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError('Unable to load model metadata.');
        }
      }
    }

    loadMetadata();

    return () => controller.abort();
  }, []);

  // ------------------------------------
  // 2. Reload ALL THREE whenever variable/timeIndex/depth changes
  // ------------------------------------
  useEffect(() => {
    if (depth === null) return;

    const controller = new AbortController();

    async function loadFields() {
      try {
        setLoading(true);
        setError(null);

        const [scalar, eastward, northward] = await Promise.all([
          getModelField(variable, timeIndex, depth!, controller.signal),
          getModelField('uo', timeIndex, depth!, controller.signal),
          getModelField('vo', timeIndex, depth!, controller.signal),
        ]);

        setScalarField(scalar);
        setUField(eastward);
        setVField(northward);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError('Unable to load ocean model data.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadFields();

    return () => controller.abort();
  }, [variable, timeIndex, depth]);

  return {
    metadata,

    variable,
    setVariable,

    timeIndex,
    setTimeIndex,

    depth,
    setDepth,

    scalarField,
    uField,
    vField,

    loading,
    error,
  };
}

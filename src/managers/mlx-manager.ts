import { LLM, ModelManager } from 'react-native-nitro-mlx';
import { EngineCaps, GenOpts, InferenceManager, Msg } from './inference-manager';
import * as FileSystem from 'expo-file-system';

const caps: EngineCaps = {
  embeddings: false,
  vision: false,
  audio: false,
  rag: false,
  grammar: false,
  jinja: false,
  dry: false,
  mirostat: false,
  xtc: false,
};

type State = {
  loaded: boolean,
  modelId: string,
  modelPath: string,
};

class MlxManager implements InferenceManager {
  private state: State = { loaded: false, modelId: '', modelPath: '' };

  private extractModelId(modelPath: string): string {
    const parts = modelPath.split('/');
    const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
    return lastPart.replace(/_/g, '/');
  }

  private async validateMLXModel(modelPath: string): Promise<boolean> {
    try {
      console.log('mlx_validate_start', { modelPath });
      
      const requiredFiles = [
        'config.json',
        'tokenizer.json',
        'tokenizer_config.json',
      ];

      const dirPath = modelPath.endsWith('.safetensors') || modelPath.endsWith('.npz')
        ? modelPath.substring(0, modelPath.lastIndexOf('/'))
        : modelPath;

      console.log('mlx_validate_dirpath', { dirPath, isFile: modelPath.endsWith('.safetensors') || modelPath.endsWith('.npz') });

      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      console.log('mlx_dir_info', { exists: dirInfo.exists, isDirectory: dirInfo.isDirectory });
      
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        console.log('mlx_dir_not_found');
        return false;
      }

      const files = await FileSystem.readDirectoryAsync(dirPath);
      console.log('mlx_dir_files', { filesCount: files.length, files });

      for (const file of requiredFiles) {
        const found = files.some((f: string) => f.endsWith(file));
        console.log('mlx_file_check', { file, found, matchingFiles: files.filter((f: string) => f.endsWith(file)) });
        if (!found) {
          console.log('mlx_missing_file', file);
          return false;
        }
      }

      const hasWeights = files.some((f: string) => 
        f.endsWith('.safetensors') || f.endsWith('.npz')
      );
      console.log('mlx_weights_check', { hasWeights, weightFiles: files.filter((f: string) => f.endsWith('.safetensors') || f.endsWith('.npz')) });
      
      if (!hasWeights) {
        console.log('mlx_missing_weights');
        return false;
      }

      console.log('mlx_validation_success');
      return true;
    } catch (error) {
      console.log('mlx_validation_error', error);
      return false;
    }
  }

  async init(modelPath: string) {
    console.log('mlx_init_start', modelPath);
    
    const isValid = await this.validateMLXModel(modelPath);
    if (!isValid) {
      throw new Error('mlx_model_invalid_structure');
    }

    const modelId = this.extractModelId(modelPath);
    console.log('mlx_model_id', modelId);

    try {
      await LLM.load(modelId, {
        onProgress: (progress) => {
          console.log('mlx_loading_progress', progress);
        },
      });
      
      this.state = { loaded: true, modelId, modelPath };
      console.log('mlx_init_complete');
    } catch (error) {
      console.log('mlx_init_error', error);
      throw error;
    }
  }

  async gen(messages: Msg[], opts?: GenOpts) {
    if (!this.state.loaded) {
      throw new Error('engine_not_ready');
    }
    const prompt = messages
      .map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : ''}`)
      .join('\n');
    let full = '';
    await LLM.stream(prompt, token => {
      full += token;
      if (opts?.onToken) {
        return opts.onToken(token);
      }
    });
    return full.trim();
  }

  async embed(text: string) {
    return Promise.reject<number[]>(new Error('embeddings_not_supported'));
  }

  async release() {
    if (this.state.loaded) {
      try {
        console.log('mlx_unload_start');
        LLM.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
        this.state = { loaded: false, modelId: '', modelPath: '' };
        console.log('mlx_unload_complete');
      } catch (error) {
        console.log('mlx_unload_error', error);
        this.state = { loaded: false, modelId: '', modelPath: '' };
      }
    }
  }

  caps() {
    return caps;
  }

  ready() {
    return this.state.loaded;
  }
}

export const mlxManager = new MlxManager();

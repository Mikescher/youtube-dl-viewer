using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace youtube_dl_viewer.Config
{
    public abstract class ConfigAttribute : Attribute
    {
        public abstract IEnumerable<string> Keys { get; }
        public abstract string FormatValue(object value);
    }
    
    public class StringConfigAttribute: ConfigAttribute
    {
        public readonly string ParameterKey;

        public override IEnumerable<string> Keys => new[]{ParameterKey};

        public StringConfigAttribute(string key)
        {
            ParameterKey = key;
        }

        public override string FormatValue(object value) => (string) value;
    }
    
    public class IntConfigAttribute: ConfigAttribute
    {
        public readonly string ParameterKey;
        
        public override IEnumerable<string> Keys => new[]{ParameterKey};
        
        public IntConfigAttribute(string key)
        {
            ParameterKey = key;
        }
        
        public override string FormatValue(object value) => ((int) value).ToString();
    }
    
    public class BoolConfigAttribute: ConfigAttribute
    {
        public readonly string ParameterKeySet;
        public readonly string ParameterKeyUnset;
        
        public override IEnumerable<string> Keys => new[]{ ParameterKeySet, ParameterKeyUnset }.Where(p => p != null);
        
        public BoolConfigAttribute(string keySet, string keyUnset)
        {
            ParameterKeySet = keySet;
            ParameterKeyUnset = keyUnset;
        }
        
        public override string FormatValue(object value) => ((bool) value).ToString();
    }
    
    public class DirectBoolConfigAttribute: ConfigAttribute
    {
        public readonly string ParameterKey;
        
        public override IEnumerable<string> Keys => new[]{ParameterKey};
        
        public DirectBoolConfigAttribute(string key)
        {
            ParameterKey = key;
        }
        
        public override string FormatValue(object value) => ((bool) value).ToString();
    }
    
    public class IntEnumConfigAttribute: ConfigAttribute
    {
        public readonly string ParameterKey;
        public readonly string[] EnumValues;
        
        public override IEnumerable<string> Keys => new[]{ParameterKey};
        
        public IntEnumConfigAttribute(string key, string[] values)
        {
            ParameterKey = key;
            EnumValues   = values;
        }

        public override string FormatValue(object value)
        {
            var v = (int) value;
            if (v >= 0 && v < EnumValues.Length) return EnumValues[v];
            return v.ToString();
        }
    }
    
    public class EnumConfigAttribute: ConfigAttribute
    {
        public readonly string ParameterKey;

        public override IEnumerable<string> Keys => new[]{ParameterKey};

        public EnumConfigAttribute(string key)
        {
            ParameterKey = key;
        }

        public override string FormatValue(object value) => value?.ToString();
    }
}